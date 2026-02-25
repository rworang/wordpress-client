import { describe, it, expect, vi } from 'vitest'
import { dedup } from '../src/utils/dedup'

describe('dedup', () => {
  it('returns the same promise for concurrent calls with the same key', async () => {
    const fn = vi.fn().mockResolvedValue('result')
    const [a, b] = await Promise.all([
      dedup('key1', fn),
      dedup('key1', fn),
    ])
    expect(a).toBe('result')
    expect(b).toBe('result')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('calls again after the first promise settles', async () => {
    let count = 0
    const fn = () => Promise.resolve(++count)

    const first = await dedup('key2', fn)
    const second = await dedup('key2', fn)
    expect(first).toBe(1)
    expect(second).toBe(2)
  })

  it('cleans up after rejection', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok')

    await expect(dedup('key3', fn)).rejects.toThrow('fail')
    const result = await dedup('key3', fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
