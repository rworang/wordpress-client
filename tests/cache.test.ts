import { describe, it, expect, vi } from 'vitest'
import { TTLCache } from '../src/utils/cache'

describe('TTLCache', () => {
  it('stores and retrieves values', () => {
    const cache = new TTLCache<string>()
    cache.set('a', 'hello')
    expect(cache.get('a')).toBe('hello')
  })

  it('returns undefined for missing keys', () => {
    const cache = new TTLCache<string>()
    expect(cache.get('missing')).toBeUndefined()
  })

  it('expires entries after TTL', () => {
    vi.useFakeTimers()
    const cache = new TTLCache<string>({ ttl: 100 })
    cache.set('a', 'hello')
    expect(cache.get('a')).toBe('hello')

    vi.advanceTimersByTime(101)
    expect(cache.get('a')).toBeUndefined()
    vi.useRealTimers()
  })

  it('reports has() correctly including expiry', () => {
    vi.useFakeTimers()
    const cache = new TTLCache<string>({ ttl: 50 })
    cache.set('a', 'hello')
    expect(cache.has('a')).toBe(true)

    vi.advanceTimersByTime(51)
    expect(cache.has('a')).toBe(false)
    vi.useRealTimers()
  })

  it('deletes entries', () => {
    const cache = new TTLCache<string>()
    cache.set('a', 'hello')
    expect(cache.delete('a')).toBe(true)
    expect(cache.get('a')).toBeUndefined()
  })

  it('clears all entries', () => {
    const cache = new TTLCache<string>()
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
  })

  it('evicts oldest entry when maxEntries is reached', () => {
    const cache = new TTLCache<string>({ maxEntries: 2 })
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('c', '3') // should evict 'a'
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe('2')
    expect(cache.get('c')).toBe('3')
  })

  it('does not evict when updating an existing key', () => {
    const cache = new TTLCache<string>({ maxEntries: 2 })
    cache.set('a', '1')
    cache.set('b', '2')
    cache.set('a', 'updated') // update, not insert
    expect(cache.get('a')).toBe('updated')
    expect(cache.get('b')).toBe('2')
  })

  it('invalidates string-matched prefixes and returns the removed count', () => {
    const cache = new TTLCache<string>()
    cache.set('api:/posts:{"page":1}', 'posts')
    cache.set('api:/categories:{}', 'categories')
    cache.set('site:/worang/v1/cache-version:{}', 'custom')

    const removed = cache.invalidate('/posts')

    expect(removed).toBe(1)
    expect(cache.get('api:/posts:{"page":1}')).toBeUndefined()
    expect(cache.get('api:/categories:{}')).toBe('categories')
    expect(cache.get('site:/worang/v1/cache-version:{}')).toBe('custom')
  })

  it('invalidates keys by regular expression', () => {
    const cache = new TTLCache<string>()
    cache.set('api:/posts:{}', 'posts')
    cache.set('site:/worang/v1/cache-version:{}', 'custom')

    const removed = cache.invalidate(/^site:\/worang\/v1\//)

    expect(removed).toBe(1)
    expect(cache.get('site:/worang/v1/cache-version:{}')).toBeUndefined()
    expect(cache.get('api:/posts:{}')).toBe('posts')
  })

  it('invalidates keys via predicate function', () => {
    const cache = new TTLCache<string>()
    cache.set('api:/posts:{}', 'posts')
    cache.set('api:/categories:{}', 'categories')

    const removed = cache.invalidate((key) => key.includes('/categories'))

    expect(removed).toBe(1)
    expect(cache.get('api:/categories:{}')).toBeUndefined()
    expect(cache.get('api:/posts:{}')).toBe('posts')
  })
})
