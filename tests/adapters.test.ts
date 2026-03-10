import { describe, it, expect } from 'vitest'
import { toPost } from '../src/adapters/post'
import { toMedia, toMediaFromFeatured } from '../src/adapters/media'
import { toCategory } from '../src/adapters/category'
import { toAuthor } from '../src/adapters/author'
import { WordpressSchemaError } from '../src/errors'
import { rawPost, rawMedia, rawCategory, rawAuthor, rawFeaturedMedia } from './fixtures/raw'

describe('toAuthor', () => {
  it('transforms a raw author', () => {
    const result = toAuthor(rawAuthor)
    expect(result).toEqual({
      id: 1,
      name: 'Jane Doe',
      url: 'https://example.com',
      description: 'A test author',
    })
  })

  it('throws WordpressSchemaError for invalid input', () => {
    expect(() => toAuthor({ id: 'bad' } as any)).toThrow(WordpressSchemaError)
  })
})

describe('toCategory', () => {
  it('transforms a raw category', () => {
    const result = toCategory(rawCategory)
    expect(result).toEqual({
      id: 5,
      slug: 'tech',
      name: 'Technology',
      description: 'Tech posts',
      count: 12,
    })
  })

  it('throws WordpressSchemaError for invalid input', () => {
    expect(() => toCategory({ id: 'bad' } as any)).toThrow(WordpressSchemaError)
  })
})

describe('toMedia', () => {
  it('transforms a raw media item', () => {
    const result = toMedia(rawMedia)
    expect(result.id).toBe(10)
    expect(result.url).toBe('https://example.com/image.jpg')
    expect(result.alt).toBe('Test image alt')
    expect(result.mimeType).toBe('image/jpeg')
    expect(result.width).toBe(1200)
    expect(result.height).toBe(800)
    expect(result.sizes.thumbnail).toBeDefined()
    expect(result.sizes.thumbnail.width).toBe(150)
  })

  it('reads alt from alt_text not description.rendered', () => {
    const result = toMedia(rawMedia)
    expect(result.alt).toBe(rawMedia.alt_text)
    expect(result.alt).not.toBe(rawMedia.description.rendered)
  })

  it('throws WordpressSchemaError for invalid input', () => {
    expect(() => toMedia({ id: 'bad' } as any)).toThrow(WordpressSchemaError)
  })
})

describe('toMediaFromFeatured', () => {
  it('transforms featured media', () => {
    const result = toMediaFromFeatured(rawFeaturedMedia)
    expect(result).toBeDefined()
    expect(result!.id).toBe(10)
    expect(result!.url).toBe('https://example.com/image.jpg')
    expect(result!.sizes.thumbnail).toBeDefined()
  })

  it('returns undefined when raw is undefined', () => {
    expect(toMediaFromFeatured(undefined)).toBeUndefined()
  })

  it('returns undefined when media_details is missing', () => {
    expect(toMediaFromFeatured({ id: 1, source_url: '', alt_text: '' })).toBeUndefined()
  })

  it('throws WordpressSchemaError for invalid featured media', () => {
    expect(() => toMediaFromFeatured({
      id: 'bad',
      source_url: '',
      alt_text: '',
      media_details: { width: 0, height: 0, sizes: {} },
    } as any)).toThrow(WordpressSchemaError)
  })
})

describe('toPost', () => {
  it('transforms a raw post with embedded data', () => {
    const result = toPost(rawPost)
    expect(result.id).toBe(1)
    expect(result.slug).toBe('hello-world')
    expect(result.title).toBe('Hello World')
    expect(result.author.name).toBe('Jane Doe')
    expect(result.categories).toHaveLength(1)
    expect(result.categories[0].slug).toBe('tech')
    expect(result.featuredMedia).toBeDefined()
    expect(result.sticky).toBe(false)
  })

  it('populates tags from embedded wp:term[1]', () => {
    const result = toPost(rawPost)
    expect(result.tags).toHaveLength(1)
    expect(result.tags[0].slug).toBe('javascript')
    expect(result.tags[0].name).toBe('JavaScript')
  })

  it('handles post without embedded data', () => {
    const { _embedded, ...postWithoutEmbedded } = rawPost
    const result = toPost(postWithoutEmbedded)
    expect(result.author).toEqual({ id: 0, name: '', url: '', description: '' })
    expect(result.categories).toEqual([])
    expect(result.tags).toEqual([])
    expect(result.featuredMedia).toBeUndefined()
  })

  it('throws WordpressSchemaError for invalid input', () => {
    expect(() => toPost({ id: 'bad' } as any)).toThrow(WordpressSchemaError)
  })
})
