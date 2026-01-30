import { useCallback, useEffect, useRef, useState } from "react"
import { Meeting } from "@/lib/types"

// Azure Storage configuration
interface AzureStorageConfig {
  storageAccountName: string
  containerName: string
  sasToken?: string
}

// Meetings data with version timestamp
interface MeetingsData {
  version: number  // timestamp of last update
  meetings: Meeting[]
}

function getAzureConfig(): AzureStorageConfig {
  const storageAccountName = import.meta.env.VITE_AZURE_STORAGE_ACCOUNT || ""
  const containerName = import.meta.env.VITE_AZURE_STORAGE_CONTAINER || "app-data"
  const sasToken = import.meta.env.VITE_AZURE_STORAGE_SAS || ""
  return { storageAccountName, containerName, sasToken }
}

function buildUrl(config: AzureStorageConfig): string {
  const baseUrl = `https://${config.storageAccountName}.blob.core.windows.net/${config.containerName}/meetings.json`
  const token = (config.sasToken || "").trim()
  if (!token) return baseUrl
  return token.startsWith("?") ? `${baseUrl}${token}` : `${baseUrl}?${token}`
}

const DEFAULT_DATA: MeetingsData = { version: 0, meetings: [] }

/**
 * Hook per gestire i meeting con controllo di concorrenza basato su timestamp.
 * 
 * Ritorna: [meetings, setMeetings, refresh, isStale]
 * - meetings: array dei meeting
 * - setMeetings: funzione per aggiornare (può fallire se versione non corrisponde)
 * - refresh: forza ricaricamento dal server
 * - isStale: true se i dati locali sono obsoleti (qualcun altro ha modificato)
 */
export function useMeetings(): [
  Meeting[],
  (updater: (current: Meeting[]) => Meeting[]) => Promise<boolean>,
  () => Promise<void>,
  boolean
] {
  const [data, setData] = useState<MeetingsData>(DEFAULT_DATA)
  const [isStale, setIsStale] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const configRef = useRef(getAzureConfig())
  const mountedRef = useRef(true)

  // Fetch data from server
  const fetchData = useCallback(async (): Promise<MeetingsData> => {
    const url = buildUrl(configRef.current)
    try {
      const response = await fetch(url)
      if (!response.ok) {
        if (response.status === 404) {
          // Create initial empty data
          await saveData(DEFAULT_DATA)
          return DEFAULT_DATA
        }
        throw new Error(`Failed to fetch: ${response.statusText}`)
      }
      const json = await response.json()
      // Handle legacy format (array without version)
      if (Array.isArray(json)) {
        return { version: Date.now(), meetings: json }
      }
      return json as MeetingsData
    } catch (error) {
      console.error("Error fetching meetings:", error)
      return DEFAULT_DATA
    }
  }, [])

  // Save data to server (internal, no version check)
  const saveData = async (newData: MeetingsData): Promise<void> => {
    const url = buildUrl(configRef.current)
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-ms-blob-type": "BlockBlob",
      },
      body: JSON.stringify(newData),
    })
    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`)
    }
  }

  // Load initial data
  useEffect(() => {
    mountedRef.current = true
    
    const load = async () => {
      const fetched = await fetchData()
      if (mountedRef.current) {
        setData(fetched)
        setIsLoading(false)
      }
    }
    load()

    return () => { mountedRef.current = false }
  }, [fetchData])

  // Refresh: force reload from server
  const refresh = useCallback(async () => {
    const fetched = await fetchData()
    if (mountedRef.current) {
      setData(fetched)
      setIsStale(false)
    }
  }, [fetchData])

  // Update meetings with version check
  const updateMeetings = useCallback(
    async (updater: (current: Meeting[]) => Meeting[]): Promise<boolean> => {
      // First, fetch current server data to check version
      const serverData = await fetchData()
      
      if (serverData.version !== data.version) {
        // Version mismatch - someone else modified the data
        if (mountedRef.current) {
          setData(serverData)
          setIsStale(true)
        }
        return false
      }

      // Version matches, apply update
      const newMeetings = updater(serverData.meetings)
      const newData: MeetingsData = {
        version: Date.now(),
        meetings: newMeetings,
      }

      try {
        await saveData(newData)
        if (mountedRef.current) {
          setData(newData)
          setIsStale(false)
        }
        return true
      } catch (error) {
        console.error("Error saving meetings:", error)
        return false
      }
    },
    [data.version, fetchData]
  )

  return [
    isLoading ? [] : data.meetings,
    updateMeetings,
    refresh,
    isStale
  ]
}
