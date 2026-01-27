import { useState, useEffect, useCallback, useMemo } from "react"

// Custom KV client that explicitly rejects localStorage fallback
class NoFallbackKVClient {
  private baseUrl = '/_spark/kv'
  
  async getKey<T>(key: string): Promise<T | undefined> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
        },
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return undefined
        }
        throw new Error(`Failed to fetch KV key: ${response.statusText}`)
      }
      
      const responseText = await response.text()
      return JSON.parse(responseText)
    } catch (error) {
      console.error(`Failed to get key "${key}" from Spark KV backend:`, error)
      throw error
    }
  }
  
  async setKey<T>(key: string, value: T): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-Spark-Initial': 'false',
        },
        body: JSON.stringify(value),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to set key: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Failed to set key "${key}" in Spark KV backend:`, error)
      throw error
    }
  }
  
  async deleteKey(key: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      })
      
      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete key: ${response.statusText}`)
      }
    } catch (error) {
      console.error(`Failed to delete key "${key}" from Spark KV backend:`, error)
      throw error
    }
  }
  
  async getOrSetKey<T>(key: string, initialValue: T): Promise<T> {
    const existingValue = await this.getKey<T>(key)
    if (existingValue !== undefined) {
      return existingValue
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'X-Spark-Initial': 'true',
        },
        body: JSON.stringify(initialValue),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to set default value: ${response.statusText}`)
      }
      
      return initialValue
    } catch (error) {
      console.error(`Failed to initialize key "${key}" in Spark KV backend:`, error)
      throw error
    }
  }
}

/**
 * Custom useKV hook that does NOT fall back to localStorage.
 * This ensures data is ONLY stored in the Spark KV backend.
 * If the Spark backend is not available, this will throw errors instead
 * of silently falling back to browser localStorage.
 * 
 * @param key - The key under which to store the value
 * @param initialValue - The initial value to use if no stored value is found
 * @returns An array containing the current value, a setter function, and a delete function
 */
export function useKVNoFallback<T = string>(
  key: string,
  initialValue?: T
): readonly [T | undefined, (newValue: T | ((oldValue?: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T | undefined>(initialValue)
  
  const kvClient = useMemo(() => new NoFallbackKVClient(), [])
  
  // Initialize value from backend
  useEffect(() => {
    let mounted = true
    
    async function getOrSetKey() {
      try {
        const fetchedValue = await kvClient.getOrSetKey(key, initialValue as T)
        if (mounted) {
          setValue(fetchedValue)
        }
      } catch (error) {
        console.error(
          `CRITICAL: Cannot connect to Spark KV backend. ` +
          `localStorage fallback is disabled. The app requires a properly configured ` +
          `Spark environment to function. Error:`, error
        )
        // Keep the initial value but log the error
        if (mounted) {
          setValue(initialValue)
        }
      }
    }
    
    getOrSetKey()
    
    return () => {
      mounted = false
    }
  }, [kvClient, key, initialValue])
  
  const userSetValue = useCallback(
    (newValue: T | ((oldValue?: T) => T)) => {
      setValue((currentValue) => {
        const nextValue = typeof newValue === 'function'
          ? (newValue as (oldValue?: T) => T)(currentValue)
          : newValue
        
        // Attempt to save to backend
        kvClient.setKey(key, nextValue).catch((error) => {
          console.error(
            `CRITICAL: Failed to save data to Spark KV backend. ` +
            `The change will be lost on page reload. Error:`, error
          )
        })
        
        return nextValue
      })
    },
    [key, kvClient]
  )
  
  const deleteValue = useCallback(() => {
    kvClient.deleteKey(key).catch((error) => {
      console.error(
        `CRITICAL: Failed to delete data from Spark KV backend. Error:`, error
      )
    })
    setValue(undefined)
  }, [key, kvClient])
  
  return [value, userSetValue, deleteValue] as const
}
