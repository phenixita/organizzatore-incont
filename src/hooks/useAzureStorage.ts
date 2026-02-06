import { useCallback, useEffect, useState } from "react"

// Azure Storage configuration
interface AzureStorageConfig {
  storageAccountName: string
  containerName: string
  sasToken?: string
}

// Get config from environment
function getAzureConfig(): AzureStorageConfig {
  console.debug("Environment variables:", import.meta.env)

  const storageAccountName = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT || "xxxx"
  const containerName = import.meta.env.VITE_AZURE_STORAGE_CONTAINER || "app-data"
  const sasToken = import.meta.env.VITE_AZURE_STORAGE_SAS || "fasdf"

  return { storageAccountName, containerName, sasToken }
}

// Storage interface
class AzureStorageService {
  private config: AzureStorageConfig
  private cache: Map<string, unknown> = new Map()

  constructor() {
    this.config = getAzureConfig()
  }

  private buildUrl(key: string): string {
    const baseUrl = `https://${this.config.storageAccountName}.blob.core.windows.net/${this.config.containerName}/${key}.json`
    const token = (this.config.sasToken || "").trim()
    if (!token) {
      return baseUrl
    }
    return token.startsWith("?") ? `${baseUrl}${token}` : `${baseUrl}?${token}`
  }

  async get<T>(key: string, defaultValue: T): Promise<T> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) as T
    }

    try {
      const url = this.buildUrl(key)
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 404) {
          const emptyValue = defaultValue
          try {
            await this.set(key, emptyValue)
          } catch (error) {
            console.warn(`Failed to create missing key ${key}:`, error)
          }
          this.cache.set(key, emptyValue)
          return emptyValue
        }
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const data = await response.json()
      this.cache.set(key, data)
      return data as T
    } catch (error) {
      console.error(`Error fetching key ${key}:`, error)
      return defaultValue
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      const url = this.buildUrl(key)
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-ms-blob-type": "BlockBlob",
        },
        body: JSON.stringify(value),
      })

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`)
      }

      this.cache.set(key, value)
    } catch (error) {
      console.error(`Error saving key ${key}:`, error)
      throw error
    }
  }

  invalidateCache(key: string) {
    this.cache.delete(key)
  }
}

// Singleton instance
const storageService = new AzureStorageService()

/**
 * Hook to use Azure Storage as a key-value store
 */
export function useAzureStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  // Load initial value
  useEffect(() => {
    let mounted = true

    const loadValue = async () => {
      try {
        const stored = await storageService.get(key, defaultValue)
        if (mounted) {
          setValue(stored)
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadValue()

    return () => {
      mounted = false
    }
  }, [key, defaultValue])

  // Update function
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const nextValue = typeof newValue === "function" 
          ? (newValue as (prev: T) => T)(prev) 
          : newValue

        // Save to storage
        storageService.set(key, nextValue).catch((error) => {
          console.error(`Error saving ${key}:`, error)
        })

        return nextValue
      })
    },
    [key]
  )

  return [isLoading ? defaultValue : value, updateValue]
}
