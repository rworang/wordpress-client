import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchWithRetry, parseResponseBody, parseRetryAfterMs } from '../src/utils/http'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('http utilities', () => {
  describe('parseRetryAfterMs', () => {
    it('parses integer seconds into milliseconds', () => {
      expect(parseRetryAfterMs(new Headers({ 'Retry-After': '120' }))).toBe(120_000)
    })

    it('returns null when the header is missing or invalid', () => {
      expect(parseRetryAfterMs(new Headers())).toBeNull()
      expect(parseRetryAfterMs(new Headers({ 'Retry-After': 'not-a-number' }))).toBeNull()
    })

    it('parses HTTP-date values into milliseconds', () => {
      vi.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-20T00:00:00Z').getTime())

      expect(parseRetryAfterMs(new Headers({ 'Retry-After': 'Mon, 20 Apr 2026 00:00:01 GMT' }))).toBe(1_000)
    })
  })

  describe('parseResponseBody', () => {
    it('returns undefined for 204 and 205 responses', async () => {
      await expect(parseResponseBody(new Response(null, { status: 204 }))).resolves.toBeUndefined()
      await expect(parseResponseBody(new Response(null, { status: 205 }))).resolves.toBeUndefined()
    })

    it('parses valid JSON responses', async () => {
      const response = new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

      await expect(parseResponseBody<{ ok: boolean }>(response)).resolves.toEqual({ ok: true })
    })

    it('returns undefined for empty or malformed non-json responses', async () => {
      const empty = new Response('', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })
      const malformed = new Response('not-json', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      })

      await expect(parseResponseBody(empty)).resolves.toBeUndefined()
      await expect(parseResponseBody(malformed)).resolves.toBeUndefined()
    })

    it('returns undefined instead of throwing for malformed json bodies', async () => {
      const response = new Response('{', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })

      await expect(parseResponseBody(response)).resolves.toBeUndefined()
    })
  })

  describe('fetchWithRetry', () => {
    it('returns data on the first successful request', async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      vi.stubGlobal('fetch', fetchMock)

      const response = await fetchWithRetry<{ ok: boolean }>('https://example.com', { method: 'GET' }, { retries: 0 })

      expect(response.status).toBe(200)
      expect(response.data).toEqual({ ok: true })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('retries a transient 500 and eventually succeeds', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'nope' }), { status: 500 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      vi.stubGlobal('fetch', fetchMock)

      const response = await fetchWithRetry<{ ok: boolean }>(
        'https://example.com',
        { method: 'GET' },
        { retries: 1, baseBackoffMs: 0 },
      )

      expect(response.status).toBe(200)
      expect(response.data).toEqual({ ok: true })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('throws after network retries are exhausted', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new TypeError('network down'))
      vi.stubGlobal('fetch', fetchMock)

      await expect(
        fetchWithRetry('https://example.com', { method: 'GET' }, { retries: 1, baseBackoffMs: 0 }),
      ).rejects.toThrow('network down')
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('does not retry a non-idempotent POST by default', async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'fail' }), { status: 500 }))
      vi.stubGlobal('fetch', fetchMock)

      const response = await fetchWithRetry('https://example.com', { method: 'POST' }, { retries: 3, baseBackoffMs: 0 })

      expect(response.status).toBe(500)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('retries an explicitly idempotent POST', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ message: 'fail' }), { status: 500 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      vi.stubGlobal('fetch', fetchMock)

      const response = await fetchWithRetry<{ ok: boolean }>(
        'https://example.com',
        { method: 'POST' },
        { retries: 1, idempotent: true, baseBackoffMs: 0 },
      )

      expect(response.status).toBe(200)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('retries after a network TypeError', async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new TypeError('temporary network failure'))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      vi.stubGlobal('fetch', fetchMock)

      const response = await fetchWithRetry<{ ok: boolean }>(
        'https://example.com',
        { method: 'GET' },
        { retries: 1, baseBackoffMs: 0 },
      )

      expect(response.data).toEqual({ ok: true })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('waits for Retry-After before retrying a rate-limited request', async () => {
      vi.useFakeTimers()

      const controller = new AbortController()
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message: 'slow down' }), { status: 429, headers: { 'Retry-After': '1' } }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      vi.stubGlobal('fetch', fetchMock)

      const request = fetchWithRetry<{ ok: boolean }>(
        'https://example.com',
        { method: 'GET' },
        { retries: 1, signal: controller.signal, timeoutMs: 5_000 },
      )

      await vi.advanceTimersByTimeAsync(1_000)
      const response = await request

      expect(response.data).toEqual({ ok: true })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('propagates AbortError immediately when the signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort(new DOMException('aborted', 'AbortError'))

      const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.signal?.aborted) {
          throw init.signal.reason
        }
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
      })
      vi.stubGlobal('fetch', fetchMock)

      await expect(
        fetchWithRetry('https://example.com', { method: 'GET' }, { signal: controller.signal, retries: 2 }),
      ).rejects.toMatchObject({ name: 'AbortError' })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('propagates AbortError when aborted mid-request', async () => {
      const controller = new AbortController()

      const fetchMock = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener(
              'abort',
              () => reject(init.signal?.reason ?? new DOMException('aborted', 'AbortError')),
              { once: true },
            )
          }),
      )
      vi.stubGlobal('fetch', fetchMock)

      const request = fetchWithRetry(
        'https://example.com',
        { method: 'GET' },
        { signal: controller.signal, retries: 2 },
      )
      controller.abort(new DOMException('aborted', 'AbortError'))

      await expect(request).rejects.toMatchObject({ name: 'AbortError' })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('times out long-running requests', async () => {
      vi.useFakeTimers()

      const fetchMock = vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_, reject) => {
            init?.signal?.addEventListener(
              'abort',
              () => reject(init.signal?.reason ?? new DOMException('timed out', 'AbortError')),
              { once: true },
            )
          }),
      )
      vi.stubGlobal('fetch', fetchMock)

      const request = fetchWithRetry('https://example.com', { method: 'GET' }, { timeoutMs: 10, retries: 0 })
      const expectation = expect(request).rejects.toMatchObject({ name: 'AbortError' })

      await vi.advanceTimersByTimeAsync(11)
      await expectation
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })
})
