/**
 * @internal
 * Small fetch-based HTTP helper with retry semantics for transient failures.
 */

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  headers: Headers
}

export interface FetchWithRetryOptions {
  retries?: number
  idempotent?: boolean
  signal?: AbortSignal
  baseBackoffMs?: number
  timeoutMs?: number
}

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

function isDefaultIdempotentMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS'
}

function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'AbortError'
}

function parseRetryAfterMs(headers: Headers): number | null {
  const retryAfter = headers.get('retry-after')
  if (!retryAfter) return null

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000)
  }

  const asDate = Date.parse(retryAfter)
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now())
  }

  return null
}

function getBackoffMs(attempt: number, baseBackoffMs: number): number {
  return Math.round(baseBackoffMs * 2 ** attempt * (0.5 + Math.random() * 0.5))
}

function withTimeout(signal: AbortSignal | undefined, timeoutMs: number | undefined) {
  if (timeoutMs === undefined) {
    return { signal, cleanup: () => {} }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort(new DOMException(`Request timed out after ${timeoutMs}ms`, 'AbortError'))
  }, timeoutMs)

  const onAbort = () => controller.abort(signal?.reason)

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason)
    } else {
      signal.addEventListener('abort', onAbort, { once: true })
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId)
      signal?.removeEventListener('abort', onAbort)
    },
  }
}

async function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    const onAbort = () => {
      clearTimeout(timeoutId)
      reject(signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError'))
    }

    if (signal) {
      if (signal.aborted) {
        onAbort()
      } else {
        signal.addEventListener('abort', onAbort, { once: true })
      }
    }
  })
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.status === 205) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  if (contentType.includes('application/json') || contentType.includes('+json')) {
    return (await response.json()) as T
  }

  const text = await response.text()
  if (!text) {
    return undefined as T
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return undefined as T
  }
}

export async function fetchWithRetry<T>(
  url: string,
  init: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<HttpResponse<T>> {
  const method = (init.method ?? 'GET').toUpperCase()
  const retries = options.retries ?? 3
  const baseBackoffMs = options.baseBackoffMs ?? 300
  const idempotent = options.idempotent ?? isDefaultIdempotentMethod(method)

  for (let attempt = 0; ; attempt++) {
    const { signal, cleanup } = withTimeout(options.signal, options.timeoutMs)

    try {
      const response = await fetch(url, { ...init, signal })
      const data = await parseResponseBody<T>(response)
      const result: HttpResponse<T> = {
        data,
        status: response.status,
        headers: response.headers,
      }

      const shouldRetry = idempotent && RETRYABLE_STATUS_CODES.has(response.status) && attempt < retries
      if (!shouldRetry) {
        return result
      }

      const delayMs = parseRetryAfterMs(response.headers) ?? getBackoffMs(attempt, baseBackoffMs)
      await wait(delayMs, options.signal)
    } catch (error) {
      if (isAbortError(error)) {
        throw error
      }

      const shouldRetry = idempotent && error instanceof TypeError && attempt < retries
      if (!shouldRetry) {
        throw error
      }

      await wait(getBackoffMs(attempt, baseBackoffMs), options.signal)
    } finally {
      cleanup()
    }
  }
}
