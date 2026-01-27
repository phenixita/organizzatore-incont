import { useEffect, useState } from "react"

export interface UserInfo {
  userId: string
  userDetails: string
  identityProvider: string
  userRoles: string[]
}

export interface ClientPrincipal {
  identityProvider: string
  userId: string
  userDetails: string
  userRoles: string[]
}

/**
 * Hook to fetch authentication info from Azure Static Web Apps
 * Calls /.auth/me endpoint to get current user info
 */
export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchUser = async () => {
      try {
        const response = await fetch("/.auth/me")
        
        if (!response.ok) {
          throw new Error(`Failed to fetch user info: ${response.statusText}`)
        }

        const data = await response.json()
        const clientPrincipal = data.clientPrincipal as ClientPrincipal | null

        if (mounted) {
          if (clientPrincipal) {
            setUser({
              userId: clientPrincipal.userId,
              userDetails: clientPrincipal.userDetails,
              identityProvider: clientPrincipal.identityProvider,
              userRoles: clientPrincipal.userRoles || []
            })
          } else {
            setUser(null)
          }
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"))
          setIsLoading(false)
        }
      }
    }

    fetchUser()

    return () => {
      mounted = false
    }
  }, [])

  return { user, isLoading, error, isAuthenticated: !!user }
}
