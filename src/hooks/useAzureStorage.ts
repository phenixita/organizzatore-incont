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

// Storage interface with ETag support for concurrency control
interface CachedValue<T> {
  data: T
  etag: string | null
}

class AzureStorageService {
  private config: AzureStorageConfig
  private cache: Map<string, CachedValue<any>> = new Map()
  private refreshIntervals: Map<string, NodeJS.Timeout> = new Map()

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
      return this.cache.get(key)!.data
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
          this.cache.set(key, { data: emptyValue, etag: null })
          return emptyValue
        }
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const data = await response.json()
      const etag = response.headers.get('etag')
      this.cache.set(key, { data, etag })
      return data as T
    } catch (error) {
      console.error(`Error fetching key ${key}:`, error)
      return defaultValue
    }
  }

  async set<T>(key: string, value: T, maxRetries = 3): Promise<void> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const url = this.buildUrl(key)
        const cachedValue = this.cache.get(key)
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "x-ms-blob-type": "BlockBlob",
        }
        
        // Use ETag for optimistic concurrency control if available
        if (cachedValue?.etag) {
          headers["If-Match"] = cachedValue.etag
        }
        
        const response = await fetch(url, {
          method: "PUT",
          headers,
          body: JSON.stringify(value),
        })

        if (!response.ok) {
          if (response.status === 412) {
            // Precondition failed - someone else modified the data
            console.warn(`Conflict detected for key ${key}, retrying... (attempt ${attempt + 1}/${maxRetries})`)
            
            // Refresh the data from server and retry
            await this.refresh(key, value as T)
            
            // Exponential backoff before retry
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
            lastError = new Error(`Conflict detected for key ${key}`)
            continue
          }
          throw new Error(`Failed to save: ${response.statusText}`)
        }

        // Update cache with new ETag
        const newEtag = response.headers.get('etag')
        this.cache.set(key, { data: value, etag: newEtag })
        return
      } catch (error) {
        console.error(`Error saving key ${key} (attempt ${attempt + 1}/${maxRetries}):`, error)
        lastError = error as Error
        
        if (attempt < maxRetries - 1) {
          // Exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100))
        }
      }
    }
    
    throw lastError || new Error(`Failed to save key ${key} after ${maxRetries} attempts`)
  }

  private async refresh<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const url = this.buildUrl(key)
      const response = await fetch(url)
      
      if (!response.ok) {
        console.warn(`Failed to refresh key ${key}: ${response.statusText}`)
        return defaultValue
      }

      const data = await response.json()
      const etag = response.headers.get('etag')
      this.cache.set(key, { data, etag })
      return data as T
    } catch (error) {
      console.error(`Error refreshing key ${key}:`, error)
      return defaultValue
    }
  }

  invalidateCache(key: string) {
    this.cache.delete(key)
    // Clear refresh interval if exists
    const interval = this.refreshIntervals.get(key)
    if (interval) {
      clearInterval(interval)
      this.refreshIntervals.delete(key)
    }
  }

  // Start periodic refresh for a key (useful for shared data like meetings)
  startPeriodicRefresh<T>(key: string, defaultValue: T, intervalMs: number = 30000, onUpdate?: (newValue: T) => void): void {
    // Clear existing interval if any
    this.stopPeriodicRefresh(key)
    
    const interval = setInterval(async () => {
      const cachedValue = this.cache.get(key)
      if (!cachedValue) return
      
      try {
        const url = this.buildUrl(key)
        const response = await fetch(url, { method: 'HEAD' })
        
        if (!response.ok) return
        
        const serverEtag = response.headers.get('etag')
        if (serverEtag && serverEtag !== cachedValue.etag) {
          // Data changed on server, refresh it
          console.log(`Detected change for key ${key}, refreshing...`)
          const newData = await this.refresh(key, defaultValue)
          if (onUpdate) {
            onUpdate(newData)
          }
        }
      } catch (error) {
        console.error(`Error checking for updates on key ${key}:`, error)
      }
    }, intervalMs)
    
    this.refreshIntervals.set(key, interval)
  }

  stopPeriodicRefresh(key: string): void {
    const interval = this.refreshIntervals.get(key)
    if (interval) {
      clearInterval(interval)
      this.refreshIntervals.delete(key)
    }
  }

  // Check if data has changed on server
  async hasChanged(key: string): Promise<boolean> {
    const cachedValue = this.cache.get(key)
    if (!cachedValue?.etag) return false
    
    try {
      const url = this.buildUrl(key)
      const response = await fetch(url, { method: 'HEAD' })
      
      if (!response.ok) return false
      
      const serverEtag = response.headers.get('etag')
      return serverEtag !== cachedValue.etag
    } catch (error) {
      console.error(`Error checking for changes on key ${key}:`, error)
      return false
    }
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

/**
 * Enhanced hook with automatic refresh for shared data (e.g., meetings list)
 * Automatically detects and updates when data changes on the server
 */
export function useAzureStorageWithRefresh<T>(
  key: string,
  defaultValue: T,
  refreshIntervalMs: number = 30000
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [hasExternalUpdate, setHasExternalUpdate] = useState(false)

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

  // Setup periodic refresh
  useEffect(() => {
    const handleUpdate = (newValue: T) => {
      setValue(newValue)
      setHasExternalUpdate(true)
      // Auto-clear the notification after 5 seconds
      setTimeout(() => setHasExternalUpdate(false), 5000)
    }

    storageService.startPeriodicRefresh(key, defaultValue, refreshIntervalMs, handleUpdate)

    return () => {
      storageService.stopPeriodicRefresh(key)
    }
  }, [key, defaultValue, refreshIntervalMs])

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

  return [isLoading ? defaultValue : value, updateValue, hasExternalUpdate]
}
