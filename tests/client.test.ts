import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './server'
import { WordpressClient } from '../src/client'
import { WordpressNotFoundError, WordpressAuthError, WordpressValidationError } from '../src/errors'
import { fetchAll } from '../src/utils/pagination'

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

  describe('users', () => {
    it('fetches paginated users', async () => {
      const client = createClient()
      const result = await client.users()
      expect(result.data).toHaveLength(1)
      expect(result.data[0].name).toBe('Jane Doe')
      expect(result.pagination.total).toBe(1)
    })

    it('passes per_page param in request', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/users`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('per_page')).toBe('5')
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '0' },
          })
        }),
      )

      const client = createClient()
      const result = await client.users({ per_page: 5 })
      expect(result.data).toHaveLength(0)
    })

    it('returns user by slug', async () => {
      const client = createClient()
      const author = await client.user('jane-doe')
      expect(author).not.toBeNull()
      expect(author!.name).toBe('Jane Doe')
    })

    it('returns null for non-existent user slug', async () => {
      const client = createClient()
      const author = await client.user('not-found')
      expect(author).toBeNull()
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

    it('aborts a menus request when signal is triggered', async () => {
      const controller = new AbortController()
      controller.abort()

      const client = createClient()
      await expect(client.menus({}, { signal: controller.signal })).rejects.toThrow()
    })

    it('passes per_page param to menus request', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/menus`, ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('per_page')).toBe('10')
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '0' },
          })
        }),
      )

      const client = createClient()
      const result = await client.menus({ per_page: 10 })
      expect(result.data).toHaveLength(0)
    })
  })

  describe('fetchCustom', () => {
    it('fetches data from a custom endpoint', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/events`, () => {
          return HttpResponse.json([{ id: 1, title: 'Conference' }], {
            headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
          })
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

  describe('auth', () => {
    it('constructs with no auth, credentials auth, and resolver auth', () => {
      expect(() => createClient()).not.toThrow()
      expect(
        () =>
          new WordpressClient({
            baseURL: BASE_URL,
            auth: { username: 'alice', appPassword: 'secret' },
          }),
      ).not.toThrow()
      expect(
        () =>
          new WordpressClient({
            baseURL: BASE_URL,
            auth: { getAuthHeader: () => 'Basic test-token' },
          }),
      ).not.toThrow()
    })

    it('does not send an Authorization header when auth is not configured', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBeNull()
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = createClient()
      await client.posts()
    })

    it('sends a Basic Authorization header when credentials auth is configured', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBe('Basic YWxpY2U6c2VjcmV0')
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.posts()
    })

    it('calls the auth resolver once per request', async () => {
      const getAuthHeader = vi.fn(() => 'Basic resolver-token')

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBe('Basic resolver-token')
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { getAuthHeader },
      })

      await client.posts()
      await client.posts({ page: 2 })

      expect(getAuthHeader).toHaveBeenCalledTimes(2)
    })

    it('awaits a Promise returned by the auth resolver', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBe('Basic async-token')
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { getAuthHeader: async () => 'Basic async-token' },
      })

      await client.posts()
    })

    it('throws WordpressAuthError when auth is required but unavailable', async () => {
      const client = createClient()
      const internalClient = client as unknown as {
        request: (config: { method: 'GET'; path: string; requireAuth?: boolean }) => Promise<unknown>
      }

      await expect(internalClient.request({ method: 'GET', path: '/posts', requireAuth: true })).rejects.toThrow(
        WordpressAuthError,
      )
      await expect(internalClient.request({ method: 'GET', path: '/posts', requireAuth: true })).rejects.toThrow(
        'Authentication required for write operation',
      )
    })
  })

  describe('request pipeline', () => {
    it('performs a public GET request and returns the raw HttpResponse shape', async () => {
      const client = createClient()
      const response = await client.request<{ id: number; slug: string }[]>({
        method: 'GET',
        path: '/posts',
        params: { _embed: true },
      })

      expect(response.status).toBe(200)
      expect(response.data).toHaveLength(1)
      expect(response.data[0].slug).toBe('hello-world')
      expect(response.headers.get('x-wp-total')).toBe('1')
    })

    it('sends JSON body and content type for POST requests', async () => {
      server.use(
        http.post(`${BASE_URL}/wp-json/wp/v2/posts`, async ({ request }) => {
          expect(request.headers.get('content-type')).toContain('application/json')
          await expect(request.json()).resolves.toEqual({ title: 'New post' })
          return HttpResponse.json({ ok: true }, { status: 201 })
        }),
      )

      const client = createClient()
      const response = await client.request<{ ok: boolean }>({
        method: 'POST',
        path: '/posts',
        body: { title: 'New post' },
      })

      expect(response.status).toBe(201)
      expect(response.data.ok).toBe(true)
    })

    it('invalidates cached posts after a successful POST request', async () => {
      let getCount = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, ({ request }) => {
          const url = new URL(request.url)
          if (url.searchParams.get('page') === '1') {
            getCount++
          }
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
        http.post(`${BASE_URL}/wp-json/wp/v2/posts`, () => HttpResponse.json({ ok: true }, { status: 201 })),
      )

      const client = createClient({ cache: { ttl: 5000 } })
      await client.posts({ page: 1 })
      await client.request({ method: 'POST', path: '/posts', body: { title: 'Invalidate' } })
      await client.posts({ page: 1 })

      expect(getCount).toBe(2)
    })

    it('invalidates both category and post caches after a category write', async () => {
      let postCount = 0
      let categoryCount = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          postCount++
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
        http.get(`${BASE_URL}/wp-json/wp/v2/categories`, () => {
          categoryCount++
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
        http.post(`${BASE_URL}/wp-json/wp/v2/categories`, () => HttpResponse.json({ ok: true }, { status: 201 })),
      )

      const client = createClient({ cache: { ttl: 5000 } })
      await client.posts()
      await client.categories()
      await client.request({ method: 'POST', path: '/categories', body: { name: 'New category' } })
      await client.posts()
      await client.categories()

      expect(postCount).toBe(2)
      expect(categoryCount).toBe(2)
    })

    it('invalidates keys by string prefix through client.invalidate()', async () => {
      let postCount = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          postCount++
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = createClient({ cache: { ttl: 5000 } })
      await client.posts()
      expect(client.invalidate('/posts')).toBe(1)
      await client.posts()

      expect(postCount).toBe(2)
    })

    it('invalidates custom namespace keys by regular expression', async () => {
      let callCount = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/worang/v1/cache-version`, () => {
          callCount++
          return HttpResponse.json({ version: 'v42' })
        }),
      )

      const client = createClient({ cache: { ttl: 5000 } })
      await client.cacheVersion()
      expect(client.invalidate(/^site:\/worang\/v1\//)).toBe(1)
      await client.cacheVersion()

      expect(callCount).toBe(2)
    })

    it('throws WordpressAuthError for write requests that require auth', async () => {
      const client = createClient()

      await expect(
        client.request({ method: 'POST', path: '/posts', body: { title: 'Private' }, requireAuth: true }),
      ).rejects.toThrow(WordpressAuthError)
      await expect(
        client.request({ method: 'POST', path: '/posts', body: { title: 'Private' }, requireAuth: true }),
      ).rejects.toThrow('Authentication required for write operation')
    })

    it('does not retry non-idempotent failed POST requests', async () => {
      let callCount = 0

      server.use(
        http.post(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          callCount++
          return HttpResponse.json({ message: 'Server error' }, { status: 500 })
        }),
      )

      const client = createClient({ cache: false })
      await expect(client.request({ method: 'POST', path: '/posts', body: { title: 'Retry once' } })).rejects.toThrow()
      expect(callCount).toBe(1)
    })
  })

  describe('error handling', () => {
    it('throws WordpressAuthError for 403', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          return HttpResponse.json({ code: 'rest_forbidden', message: 'Forbidden' }, { status: 403 })
        }),
      )

      const client = createClient()
      const error = await client.posts().catch((e) => e)
      expect(error).toBeInstanceOf(WordpressAuthError)
      expect(error.statusCode).toBe(403)
    })

    it('preserves HTTP status code 403 in WordpressAuthError', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts/1`, () => {
          return HttpResponse.json(
            { code: 'rest_forbidden', message: 'Sorry, you are not allowed to read this post.' },
            { status: 403 },
          )
        }),
      )

      const client = createClient()
      const error = await client.postById(1).catch((e) => e)
      expect(error).toBeInstanceOf(WordpressAuthError)
      expect(error.statusCode).toBe(403)
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

  describe('fetchAll', () => {
    it('fetches all items across multiple pages', async () => {
      const post1 = {
        id: 1,
        slug: 'post-1',
        title: { rendered: 'Post 1' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
        date: '2024-01-01T00:00:00',
        sticky: false,
      }
      const post2 = {
        id: 2,
        slug: 'post-2',
        title: { rendered: 'Post 2' },
        content: { rendered: '' },
        excerpt: { rendered: '' },
        date: '2024-01-02T00:00:00',
        sticky: false,
      }

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, ({ request }) => {
          const url = new URL(request.url)
          const page = url.searchParams.get('page')

          if (page === '1') {
            return HttpResponse.json([post1], {
              headers: { 'x-wp-total': '2', 'x-wp-totalpages': '2' },
            })
          }
          return HttpResponse.json([post2], {
            headers: { 'x-wp-total': '2', 'x-wp-totalpages': '2' },
          })
        }),
      )

      const client = createClient()
      const allPosts = await fetchAll((page) => client.posts({ page, per_page: 1 }))
      expect(allPosts).toHaveLength(2)
      expect(allPosts[0].slug).toBe('post-1')
      expect(allPosts[1].slug).toBe('post-2')
    })

    it('handles single-page results', async () => {
      const client = createClient()
      const allPosts = await fetchAll((page) => client.posts({ page }))
      expect(allPosts).toHaveLength(1)
    })
  })

  describe('abort signal', () => {
    it('aborts a request when signal is triggered', async () => {
      const controller = new AbortController()
      controller.abort()

      const client = createClient()
      await expect(client.posts({}, { signal: controller.signal })).rejects.toThrow()
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
