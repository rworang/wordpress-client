import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './server'
import { WordpressClient } from '../src/client'
import { WordpressNotFoundError, WordpressAuthError, WordpressValidationError } from '../src/errors'

const BASE_URL = 'https://test.wp.com'

function createClient(options?: { cache?: false | { ttl?: number } }) {
  return new WordpressClient({
    baseURL: BASE_URL,
    retry: { retries: 0 },
    ...options,
  })
}

describe('WordpressClient', () => {
  describe('posts', () => {
    it('fetches paginated posts', async () => {
      const client = createClient()
      const result = await client.posts()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].slug).toBe('hello-world')
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.totalPages).toBe(1)
    })

    it('returns post by slug', async () => {
      const client = createClient()
      const post = await client.post('hello-world')
      expect(post).not.toBeNull()
      expect(post!.title).toBe('Hello World')
    })

    it('returns null for non-existent slug', async () => {
      const client = createClient()
      const post = await client.post('not-found')
      expect(post).toBeNull()
    })

    it('fetches post by ID', async () => {
      const client = createClient()
      const post = await client.postById(1)
      expect(post.slug).toBe('hello-world')
    })

    it('throws WordpressNotFoundError for missing post ID', async () => {
      const client = createClient()
      await expect(client.postById(999)).rejects.toThrow(WordpressNotFoundError)
    })
  })

  describe('pages', () => {
    it('fetches paginated pages', async () => {
      const client = createClient()
      const result = await client.pages()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].slug).toBe('about')
      expect(result.pagination.total).toBe(1)
    })

    it('returns page by slug', async () => {
      const client = createClient()
      const page = await client.page('about')
      expect(page).not.toBeNull()
      expect(page!.title).toBe('About Us')
    })

    it('returns null for non-existent page slug', async () => {
      const client = createClient()
      const page = await client.page('not-found')
      expect(page).toBeNull()
    })

    it('fetches page by ID', async () => {
      const client = createClient()
      const page = await client.pageById(2)
      expect(page.slug).toBe('about')
    })

    it('throws WordpressNotFoundError for missing page ID', async () => {
      const client = createClient()
      await expect(client.pageById(999)).rejects.toThrow(WordpressNotFoundError)
    })

    it('includes parent and menuOrder fields', async () => {
      const client = createClient()
      const page = await client.page('about')
      expect(page!.parent).toBe(0)
      expect(page!.menuOrder).toBe(1)
    })
  })

  describe('categories', () => {
    it('fetches paginated categories', async () => {
      const client = createClient()
      const result = await client.categories()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].slug).toBe('tech')
    })

    it('returns category by slug', async () => {
      const client = createClient()
      const cat = await client.category('tech')
      expect(cat).not.toBeNull()
      expect(cat!.name).toBe('Technology')
    })

    it('returns null for non-existent category slug', async () => {
      const client = createClient()
      const cat = await client.category('not-found')
      expect(cat).toBeNull()
    })
  })

  describe('tags', () => {
    it('fetches paginated tags', async () => {
      const client = createClient()
      const result = await client.tags()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].slug).toBe('javascript')
    })

    it('returns tag by slug', async () => {
      const client = createClient()
      const tag = await client.tag('javascript')
      expect(tag).not.toBeNull()
      expect(tag!.name).toBe('JavaScript')
    })

    it('returns null for non-existent tag slug', async () => {
      const client = createClient()
      const tag = await client.tag('not-found')
      expect(tag).toBeNull()
    })
  })

  describe('media', () => {
    it('fetches media by ID', async () => {
      const client = createClient()
      const media = await client.media(10)
      expect(media.id).toBe(10)
      expect(media.mimeType).toBe('image/jpeg')
    })

    it('throws WordpressNotFoundError for missing media', async () => {
      const client = createClient()
      await expect(client.media(999)).rejects.toThrow(WordpressNotFoundError)
    })

    it('fetches paginated media list', async () => {
      const client = createClient()
      const result = await client.mediaList()
      expect(result.data).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
    })
  })

  describe('navigation', () => {
    it('fetches navigation menus', async () => {
      const client = createClient()
      const result = await client.menus()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Main Menu')
      expect(result.data[0].slug).toBe('main-menu')
    })

    it('fetches menu items', async () => {
      const client = createClient()
      const result = await client.menuItems()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('About')
      expect(result.data[0].url).toBe('https://example.com/about')
    })

    it('maps menu item fields correctly', async () => {
      const client = createClient()
      const result = await client.menuItems()
      const item = result.data[0]
      expect(item.parent).toBe(0)
      expect(item.menuOrder).toBe(1)
      expect(item.objectType).toBe('post_type')
      expect(item.object).toBe('page')
      expect(item.objectId).toBe(2)
    })
  })

  describe('fetchCustom', () => {
    it('fetches data from a custom endpoint', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/events`, () => {
          return HttpResponse.json(
            [{ id: 1, title: 'Conference' }],
            { headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' } },
          )
        }),
      )

      const client = createClient()
      const result = await client.fetchCustom<{ id: number; title: string }>('/events')
      expect(result.data).toHaveLength(1)
      expect(result.data[0].title).toBe('Conference')
      expect(result.pagination.total).toBe(1)
    })

    it('passes query parameters through', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/products`, ({ request }) => {
          const url = new URL(request.url)
          const perPage = url.searchParams.get('per_page')
          expect(perPage).toBe('5')
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '0' },
          })
        }),
      )

      const client = createClient()
      await client.fetchCustom('/products', { per_page: 5 })
    })
  })

  describe('error handling', () => {
    it('throws WordpressAuthError for 403', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          return HttpResponse.json(
            { code: 'rest_forbidden', message: 'Forbidden' },
            { status: 403 },
          )
        }),
      )

      const client = createClient()
      await expect(client.posts()).rejects.toThrow(WordpressAuthError)
    })

    it('throws WordpressValidationError for 400', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          return HttpResponse.json(
            {
              code: 'rest_invalid_param',
              message: 'Invalid parameter(s): per_page',
              data: {
                status: 400,
                params: { per_page: 'per_page must be between 1 and 100.' },
              },
            },
            { status: 400 },
          )
        }),
      )

      const client = createClient()
      await expect(client.posts()).rejects.toThrow(WordpressValidationError)
    })

    it('includes field details in WordpressValidationError', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          return HttpResponse.json(
            {
              code: 'rest_invalid_param',
              message: 'Invalid parameter(s): per_page',
              data: {
                status: 400,
                params: { per_page: 'per_page must be between 1 and 100.' },
              },
            },
            { status: 400 },
          )
        }),
      )

      const client = createClient()
      try {
        await client.posts()
        expect.fail('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(WordpressValidationError)
        const validationErr = err as WordpressValidationError
        expect(validationErr.details).toEqual({
          per_page: ['per_page must be between 1 and 100.'],
        })
      }
    })
  })

  describe('pagination', () => {
    it('defaults to page 1, perPage 10', async () => {
      const client = createClient()
      const result = await client.posts()
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.perPage).toBe(10)
    })

    it('handles missing pagination headers gracefully', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          return HttpResponse.json([])
        }),
      )

      const client = createClient()
      const result = await client.posts()
      expect(result.pagination.total).toBe(0)
      expect(result.pagination.totalPages).toBe(1)
    })
  })

  describe('cache', () => {
    it('returns cached response on second call', async () => {
      let callCount = 0
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/categories`, () => {
          callCount++
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '0' },
          })
        }),
      )

      const client = createClient({ cache: { ttl: 5000 } })
      await client.categories()
      await client.categories()
      expect(callCount).toBe(1)
    })

    it('does not cache when disabled', async () => {
      let callCount = 0
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/categories`, () => {
          callCount++
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '0' },
          })
        }),
      )

      const client = createClient({ cache: false })
      await client.categories()
      await client.categories()
      expect(callCount).toBe(2)
    })

    it('clearCache() invalidates cached responses', async () => {
      let callCount = 0
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/categories`, () => {
          callCount++
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '0' },
          })
        }),
      )

      const client = createClient({ cache: { ttl: 5000 } })
      await client.categories()
      client.clearCache()
      await client.categories()
      expect(callCount).toBe(2)
    })
  })

  describe('cacheVersion', () => {
    it('returns version string', async () => {
      const client = createClient()
      const version = await client.cacheVersion()
      expect(version).toBe('v42')
    })

    it('returns null on failure', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/worang/v1/cache-version`, () => {
          return HttpResponse.json({}, { status: 500 })
        }),
      )

      const client = createClient()
      const version = await client.cacheVersion()
      expect(version).toBeNull()
    })
  })
})
