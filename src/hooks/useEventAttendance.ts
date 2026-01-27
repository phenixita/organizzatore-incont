import { useCallback, useEffect, useState } from "react"

// Azure Storage configuration for event-attendance container
interface AzureStorageConfig {
  storageAccountName: string
  containerName: string
  sasToken?: string
}

// Get config from environment - using new dedicated container
function getAzureConfig(): AzureStorageConfig {
  const storageAccountName = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT || "xxxx"
  const containerName = "event-attendance" // New dedicated container
  const sasToken = import.meta.env.VITE_AZURE_STORAGE_SAS || "fasdf"

  return { storageAccountName, containerName, sasToken }
}

// Storage interface for event attendance
class EventAttendanceStorage {
  private config: AzureStorageConfig
  private cache: Map<string, any> = new Map()

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
      return this.cache.get(key)
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
const eventAttendanceStorage = new EventAttendanceStorage()

/**
 * Hook to use Event Attendance Storage (new dedicated container)
 * This replaces the old fixed participant list with authenticated attendees
 */
export function useEventAttendance<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  // Load initial value
  useEffect(() => {
    let mounted = true

    const loadValue = async () => {
      try {
        const stored = await eventAttendanceStorage.get(key, defaultValue)
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
        eventAttendanceStorage.set(key, nextValue).catch((error) => {
          console.error(`Error saving ${key}:`, error)
        })

        return nextValue
      })
    },
    [key]
  )

  return [value, updateValue, isLoading]
}
