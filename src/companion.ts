import type { WordpressClient } from './client'
import { WordpressNotFoundError } from './errors'

/** Payload returned by `GET /worang-client/v1/version` when the companion plugin is installed. */
export interface CompanionVersion {
  version: string
  features: string[]
}

/**
 * Optional companion-plugin namespace exposed as `client.companion.*`.
 *
 * All methods return `null` when the companion plugin is absent (404 on the
 * target endpoint). Any other error (network failure, 5xx) is rethrown so
 * callers can distinguish "not installed" from "installation broken".
 */
export interface CompanionNamespace {
  version(): Promise<CompanionVersion | null>
  cacheVersion(): Promise<string | null>
}

export function createCompanion(client: WordpressClient): CompanionNamespace {
  return {
    async version() {
      return fetchOrNull<CompanionVersion>(client, '/worang-client/v1/version')
    },
    async cacheVersion() {
      const result = await fetchOrNull<{ version: string }>(client, '/worang-client/v1/cache-version')
      return result ? String(result.version) : null
    },
  }
}

async function fetchOrNull<T>(client: WordpressClient, path: string): Promise<T | null> {
  try {
    const response = await client.request<T>({
      method: 'GET',
      path,
      base: 'site',
    })
    return response.data
  } catch (error) {
    if (error instanceof WordpressNotFoundError) {
      return null
    }
    throw error
  }
}
