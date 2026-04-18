/**
 * Direct-credentials auth shape. The client encodes these as HTTP Basic at
 * construction time and injects the Authorization header on outgoing requests.
 */
export interface AuthCredentials {
  username: string
  appPassword: string
}

/**
 * Resolver-based auth shape. Return null when no credentials are available.
 */
export interface AuthResolver {
  getAuthHeader: () => string | null | Promise<string | null>
}

/**
 * Authentication configuration for a WordPress client instance.
 */
export type AuthConfig = AuthCredentials | AuthResolver
