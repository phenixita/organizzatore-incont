import { useCallback, useEffect, useRef, useState } from "react"

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

// Custom error for concurrency conflicts
export class ConcurrencyConflictError extends Error {
  constructor(key: string) {
    super(`Conflitto di concorrenza: i dati per "${key}" sono stati modificati da un altro utente. Ricarica la pagina.`)
    this.name = "ConcurrencyConflictError"
  }
}

// Cached entry with ETag
interface CacheEntry<T> {
  value: T
  etag: string | null
}

// Storage interface
class AzureStorageService {
  private config: AzureStorageConfig
  private cache: Map<string, CacheEntry<unknown>> = new Map()

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

  getEtag(key: string): string | null {
    return this.cache.get(key)?.etag ?? null
  }

  async get<T>(key: string, defaultValue: T, skipCache = false): Promise<T> {
    // Check cache first (unless explicitly skipped)
    if (!skipCache && this.cache.has(key)) {
      return this.cache.get(key)!.value as T
    }

    try {
      const url = this.buildUrl(key)
      const response = await fetch(url)
      
      if (!response.ok) {
        if (response.status === 404) {
          const emptyValue = defaultValue
          try {
            await this.set(key, emptyValue, true) // isNew = true
          } catch (error) {
            console.warn(`Failed to create missing key ${key}:`, error)
          }
          return emptyValue
        }
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }

      const etag = response.headers.get("ETag")
      const data = await response.json()
      this.cache.set(key, { value: data, etag })
      return data as T
    } catch (error) {
      console.error(`Error fetching key ${key}:`, error)
      return defaultValue
    }
  }

  async set<T>(key: string, value: T, isNew = false): Promise<void> {
    const url = this.buildUrl(key)
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "x-ms-blob-type": "BlockBlob",
    }

    // Add conditional header for concurrency control
    if (isNew) {
      // Only create if blob doesn't exist
      headers["If-None-Match"] = "*"
    } else {
      const currentEtag = this.getEtag(key)
      if (currentEtag) {
        // Only update if ETag matches (no one else modified it)
        headers["If-Match"] = currentEtag
      }
    }

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(value),
      })

      // 412 Precondition Failed or 409 Conflict = concurrency conflict
      if (response.status === 412 || response.status === 409) {
        this.invalidateCache(key)
        throw new ConcurrencyConflictError(key)
      }

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`)
      }

      // Update cache with new ETag
      const newEtag = response.headers.get("ETag")
      this.cache.set(key, { value, etag: newEtag })
    } catch (error) {
      if (error instanceof ConcurrencyConflictError) {
        throw error
      }
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

// Conflict callback type
type ConflictCallback = (error: ConcurrencyConflictError) => void

/**
 * Hook to use Azure Storage as a key-value store with optimistic concurrency control.
 * Returns [value, setValue, refresh, hasConflict]
 * - value: current value
 * - setValue: update function (may trigger conflict)
 * - refresh: force reload from server
 * - hasConflict: true if a concurrency conflict occurred
 */
export function useAzureStorage<T>(
  key: string,
  defaultValue: T,
  onConflict?: ConflictCallback
): [T, (value: T | ((prev: T) => T)) => Promise<void>, () => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [hasConflict, setHasConflict] = useState(false)
  const mountedRef = useRef(true)

  // Load/refresh value from server
  const refresh = useCallback(async () => {
    try {
      storageService.invalidateCache(key)
      const stored = await storageService.get(key, defaultValue, true)
      if (mountedRef.current) {
        setValue(stored)
        setHasConflict(false)
      }
    } catch (error) {
      console.error(`Error refreshing ${key}:`, error)
    }
  }, [key, defaultValue])

  // Load initial value
  useEffect(() => {
    mountedRef.current = true

    const loadValue = async () => {
      try {
        const stored = await storageService.get(key, defaultValue)
        if (mountedRef.current) {
          setValue(stored)
        }
      } catch (error) {
        console.error(`Error loading ${key}:`, error)
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
        }
      }
    }

    loadValue()

    return () => {
      mountedRef.current = false
    }
  }, [key, defaultValue])

  // Update function with concurrency control
  const updateValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      const nextValue = typeof newValue === "function" 
        ? (newValue as (prev: T) => T)(value) 
        : newValue

      // Optimistically update local state
      setValue(nextValue)

      try {
        await storageService.set(key, nextValue)
        setHasConflict(false)
      } catch (error) {
        if (error instanceof ConcurrencyConflictError) {
          // Revert optimistic update and signal conflict
          setHasConflict(true)
          if (onConflict) {
            onConflict(error)
          }
          // Reload server value
          await refresh()
        } else {
          console.error(`Error saving ${key}:`, error)
        }
      }
    },
    [key, value, onConflict, refresh]
  )

  return [isLoading ? defaultValue : value, updateValue, refresh, hasConflict]
}
