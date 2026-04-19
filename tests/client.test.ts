import { describe, it, expect, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './server'
import { WordpressClient } from '../src/client'
import { WordpressNotFoundError, WordpressAuthError, WordpressValidationError } from '../src/errors'
import { fetchAll } from '../src/utils/pagination'
import { rawPost, rawPage, rawCategory, rawTag, rawMedia } from './fixtures/raw'

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

    it('fetches user by ID via userById', async () => {
      const client = createClient()
      const author = await client.userById(7)
      expect(author.id).toBe(7)
      expect(author.name).toBe('Jane Doe')
    })

    it('throws WordpressNotFoundError for missing user ID', async () => {
      const client = createClient()
      await expect(client.userById(999)).rejects.toThrow(WordpressNotFoundError)
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

    it('scopes invalidation to the resource when writing to a 3-segment namespace path', async () => {
      let versionGetCount = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/worang/v1/cache-version`, () => {
          versionGetCount++
          return HttpResponse.json({ version: 'v1' })
        }),
        http.post(`${BASE_URL}/wp-json/worang-client/v1/sync`, () => HttpResponse.json({ ok: true })),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        cache: { ttl: 5000 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.cacheVersion()
      // A write to a different 3-segment namespace must not sweep the whole `worang*`
      // family out of cache. The heuristic targets `/worang-client/v1/sync` only.
      await client.request({
        method: 'POST',
        path: '/worang-client/v1/sync',
        base: 'site',
        requireAuth: true,
      })
      await client.cacheVersion()

      expect(versionGetCount).toBe(1)
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

  describe('post write operations', () => {
    it('creates a post and returns the normalized Post shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const post = await client.createPost({
        title: 'Created post',
        content: '<p>Created content</p>',
        excerpt: '<p>Created excerpt</p>',
        slug: 'created-post',
      })

      expect(post.id).toBe(101)
      expect(post.title).toBe('Created post')
      expect(post.slug).toBe('created-post')
    })

    it('updates a post and returns the updated Post shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const post = await client.updatePost(1, {
        title: 'Updated post',
        excerpt: '<p>Updated excerpt</p>',
      })

      expect(post.id).toBe(1)
      expect(post.title).toBe('Updated post')
      expect(post.excerpt).toContain('Updated excerpt')
    })

    it('deletes a post and returns the previous Post', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deletePost(1)

      expect(result.deleted).toBe(true)
      if (!result.deleted) throw new Error('expected hard delete')
      expect(result.previous.id).toBe(rawPost.id)
      expect(result.previous.slug).toBe(rawPost.slug)
    })

    it('soft-deletes a post with force:false and returns the trashed Post', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deletePost(1, { force: false })

      expect(result.deleted).toBe(false)
      if (result.deleted) throw new Error('expected soft delete')
      expect(result.trashed.id).toBe(1)
      expect(result.trashed.slug).toBe(rawPost.slug)
    })

    it('requires auth for createPost', async () => {
      const client = createClient()
      await expect(client.createPost({ title: 'Private post' })).rejects.toThrow(WordpressAuthError)
    })

    it('sends the Authorization header on post writes', async () => {
      let authHeaderChecks = 0

      server.use(
        http.post(`${BASE_URL}/wp-json/wp/v2/posts`, async ({ request }) => {
          expect(request.headers.get('Authorization')).toBeTruthy()
          authHeaderChecks++
          return HttpResponse.json({ ...rawPost, id: 101 })
        }),
        http.post(`${BASE_URL}/wp-json/wp/v2/posts/:id`, async ({ request, params }) => {
          expect(request.headers.get('Authorization')).toBeTruthy()
          authHeaderChecks++
          return HttpResponse.json({ ...rawPost, id: Number(params.id) })
        }),
        http.delete(`${BASE_URL}/wp-json/wp/v2/posts/:id`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBeTruthy()
          authHeaderChecks++
          return HttpResponse.json({ deleted: true, previous: rawPost })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.createPost({ title: 'Header check' })
      await client.updatePost(1, { title: 'Header check updated' })
      await client.deletePost(1)

      expect(authHeaderChecks).toBe(3)
    })

    it('invalidates cached posts after createPost', async () => {
      let listCalls = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          listCalls++
          return HttpResponse.json([rawPost], {
            headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        cache: { ttl: 5000 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.posts()
      await client.createPost({ title: 'Invalidate cache' })
      await client.posts()

      expect(listCalls).toBe(2)
    })
  })

  describe('page write operations', () => {
    it('creates a page and returns the normalized Page shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const page = await client.createPage({
        title: 'Created page',
        content: '<p>Created page content</p>',
        slug: 'created-page',
        parent: 4,
        menu_order: 7,
      })

      expect(page.id).toBe(202)
      expect(page.title).toBe('Created page')
      expect(page.slug).toBe('created-page')
    })

    it('updates a page and returns the updated Page shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const page = await client.updatePage(2, {
        title: 'Updated page',
        excerpt: '<p>Updated page excerpt</p>',
      })

      expect(page.id).toBe(2)
      expect(page.title).toBe('Updated page')
      expect(page.excerpt).toContain('Updated page excerpt')
    })

    it('deletes a page and returns the previous Page', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deletePage(2)

      expect(result.deleted).toBe(true)
      if (!result.deleted) throw new Error('expected hard delete')
      expect(result.previous.id).toBe(rawPage.id)
      expect(result.previous.slug).toBe(rawPage.slug)
    })

    it('soft-deletes a page with force:false and returns the trashed Page', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deletePage(2, { force: false })

      expect(result.deleted).toBe(false)
      if (result.deleted) throw new Error('expected soft delete')
      expect(result.trashed.id).toBe(2)
      expect(result.trashed.slug).toBe(rawPage.slug)
    })

    it('invalidates cached pages after createPage', async () => {
      let listCalls = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/pages`, () => {
          listCalls++
          return HttpResponse.json([rawPage], {
            headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        cache: { ttl: 5000 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.pages()
      await client.createPage({ title: 'Invalidate pages cache' })
      await client.pages()

      expect(listCalls).toBe(2)
    })
  })

  describe('term write operations', () => {
    it('creates a category and returns the normalized Category shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const category = await client.createCategory({
        name: 'New Category',
        slug: 'new-category',
        description: 'Newly created',
      })

      expect(category.id).toBe(303)
      expect(category.name).toBe('New Category')
      expect(category.slug).toBe('new-category')
    })

    it('updates a category and returns the updated Category shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const category = await client.updateCategory(5, { name: 'Renamed' })

      expect(category.id).toBe(5)
      expect(category.name).toBe('Renamed')
    })

    it('deletes a category and returns the previous Category', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deleteCategory(5)

      expect(result.deleted).toBe(true)
      if (!result.deleted) throw new Error('expected hard delete')
      expect(result.previous.id).toBe(rawCategory.id)
      expect(result.previous.slug).toBe(rawCategory.slug)
    })

    it('soft-deletes a category with force:false and returns the trashed Category', async () => {
      // Note: real WordPress does not support force:false on terms (server returns 400).
      // This test exercises the client's response-shape handling, not WP semantics.
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deleteCategory(5, { force: false })

      expect(result.deleted).toBe(false)
      if (result.deleted) throw new Error('expected soft delete')
      expect(result.trashed.id).toBe(5)
    })

    it('creates a tag and returns the normalized Tag shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const tag = await client.createTag({ name: 'New Tag', slug: 'new-tag' })

      expect(tag.id).toBe(404)
      expect(tag.name).toBe('New Tag')
      expect(tag.slug).toBe('new-tag')
    })

    it('updates a tag and returns the updated Tag shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const tag = await client.updateTag(8, { description: 'Updated description' })

      expect(tag.id).toBe(8)
      expect(tag.description).toBe('Updated description')
    })

    it('deletes a tag and returns the previous Tag', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deleteTag(8)

      expect(result.deleted).toBe(true)
      if (!result.deleted) throw new Error('expected hard delete')
      expect(result.previous.id).toBe(rawTag.id)
      expect(result.previous.slug).toBe(rawTag.slug)
    })

    it('soft-deletes a tag with force:false and returns the trashed Tag', async () => {
      // See deleteCategory force:false note — same caveat on term semantics.
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deleteTag(8, { force: false })

      expect(result.deleted).toBe(false)
      if (result.deleted) throw new Error('expected soft delete')
      expect(result.trashed.id).toBe(8)
    })

    it('requires auth for createPage, createCategory, and createTag', async () => {
      const client = createClient()

      await expect(client.createPage({ title: 'Private page' })).rejects.toThrow(WordpressAuthError)
      await expect(client.createCategory({ name: 'Private category' })).rejects.toThrow(WordpressAuthError)
      await expect(client.createTag({ name: 'Private tag' })).rejects.toThrow(WordpressAuthError)
    })

    it('invalidates both category and post caches after createCategory', async () => {
      let postCount = 0
      let categoryCount = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          postCount++
          return HttpResponse.json([rawPost], {
            headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
          })
        }),
        http.get(`${BASE_URL}/wp-json/wp/v2/categories`, () => {
          categoryCount++
          return HttpResponse.json([rawCategory], {
            headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        cache: { ttl: 5000 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.posts()
      await client.categories()
      await client.createCategory({ name: 'Cross invalidate' })
      await client.posts()
      await client.categories()

      expect(postCount).toBe(2)
      expect(categoryCount).toBe(2)
    })

    it('invalidates both tag and post caches after createTag', async () => {
      let postCount = 0
      let tagCount = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/posts`, () => {
          postCount++
          return HttpResponse.json([rawPost], {
            headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
          })
        }),
        http.get(`${BASE_URL}/wp-json/wp/v2/tags`, () => {
          tagCount++
          return HttpResponse.json([rawTag], {
            headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        cache: { ttl: 5000 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.posts()
      await client.tags()
      await client.createTag({ name: 'Cross invalidate' })
      await client.posts()
      await client.tags()

      expect(postCount).toBe(2)
      expect(tagCount).toBe(2)
    })
  })

  describe('media write operations', () => {
    it('updates media metadata and returns the normalized Media shape', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const media = await client.updateMedia(10, { alt_text: 'Updated alt text' })

      expect(media.id).toBe(10)
      expect(media.alt).toBe('Updated alt text')
    })

    it('deletes media and returns the previous Media', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deleteMedia(10)

      expect(result.deleted).toBe(true)
      if (!result.deleted) throw new Error('expected hard delete')
      expect(result.previous.id).toBe(rawMedia.id)
    })

    it('soft-deletes media with force:false and returns the trashed Media', async () => {
      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const result = await client.deleteMedia(10, { force: false })

      expect(result.deleted).toBe(false)
      if (result.deleted) throw new Error('expected soft delete')
      expect(result.trashed.id).toBe(10)
    })

    it('uploads a Blob with the correct Content-Type and Content-Disposition headers', async () => {
      let receivedContentType: string | null = null
      let receivedDisposition: string | null = null
      let receivedBody: ArrayBuffer | null = null

      server.use(
        http.post(`${BASE_URL}/wp-json/wp/v2/media`, async ({ request }) => {
          receivedContentType = request.headers.get('Content-Type')
          receivedDisposition = request.headers.get('Content-Disposition')
          receivedBody = await request.arrayBuffer()
          return HttpResponse.json({ ...rawMedia, id: 505 })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const bytes = new Uint8Array([1, 2, 3, 4])
      const blob = new Blob([bytes], { type: 'image/png' })
      const media = await client.uploadMedia(blob, { filename: 'pixel.png' })

      expect(media.id).toBe(505)
      expect(receivedContentType).toBe('image/png')
      expect(receivedDisposition).toBe('attachment; filename="pixel.png"')
      expect(new Uint8Array(receivedBody!)).toEqual(bytes)
    })

    it('issues a follow-up updateMedia call when metadata is supplied', async () => {
      let uploadCalls = 0
      let updateCalls = 0

      server.use(
        http.post(`${BASE_URL}/wp-json/wp/v2/media`, () => {
          uploadCalls++
          return HttpResponse.json({ ...rawMedia, id: 505 })
        }),
        http.post(`${BASE_URL}/wp-json/wp/v2/media/:id`, async ({ request, params }) => {
          updateCalls++
          const body = (await request.json()) as Record<string, unknown>
          return HttpResponse.json({
            ...rawMedia,
            id: Number(params.id),
            alt_text: typeof body.alt_text === 'string' ? body.alt_text : rawMedia.alt_text,
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const blob = new Blob([new Uint8Array([1])], { type: 'image/png' })
      const media = await client.uploadMedia(blob, { filename: 'alt.png', altText: 'alt text' })

      expect(uploadCalls).toBe(1)
      expect(updateCalls).toBe(1)
      expect(media.alt).toBe('alt text')
    })

    it('requires auth for uploadMedia', async () => {
      const client = createClient()
      const blob = new Blob([new Uint8Array([1])], { type: 'image/png' })
      await expect(client.uploadMedia(blob)).rejects.toThrow(WordpressAuthError)
    })

    it('does not retry a 500 on upload (non-idempotent)', async () => {
      let callCount = 0

      server.use(
        http.post(`${BASE_URL}/wp-json/wp/v2/media`, () => {
          callCount++
          return HttpResponse.json({ message: 'Server error' }, { status: 500 })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 3 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const blob = new Blob([new Uint8Array([1])], { type: 'image/png' })
      await expect(client.uploadMedia(blob, { filename: 'fail.png' })).rejects.toThrow()
      expect(callCount).toBe(1)
    })

    it('invalidates cached mediaList after uploadMedia', async () => {
      let listCalls = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/media`, () => {
          listCalls++
          return HttpResponse.json([rawMedia], {
            headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
          })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        cache: { ttl: 5000 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.mediaList()
      const blob = new Blob([new Uint8Array([1])], { type: 'image/png' })
      await client.uploadMedia(blob, { filename: 'bust.png' })
      await client.mediaList()

      expect(listCalls).toBe(2)
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

  describe('companion namespace', () => {
    it('companion.version() returns the version + features on 200', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/worang-client/v1/version`, () => {
          return HttpResponse.json({ version: '1.2.3', features: ['cache-version'] })
        }),
      )

      const client = createClient()
      const result = await client.companion.version()
      expect(result).toEqual({ version: '1.2.3', features: ['cache-version'] })
    })

    it('companion.cacheVersion() returns the version string on 200', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/worang-client/v1/cache-version`, () => {
          return HttpResponse.json({ version: 'deploy-42' })
        }),
      )

      const client = createClient()
      const version = await client.companion.cacheVersion()
      expect(version).toBe('deploy-42')
    })

    it('companion.version() returns null on 404 (plugin absent)', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/worang-client/v1/version`, () => {
          return HttpResponse.json({ code: 'rest_no_route' }, { status: 404 })
        }),
      )

      const client = createClient()
      const result = await client.companion.version()
      expect(result).toBeNull()
    })

    it('companion.cacheVersion() returns null on 404 (plugin absent)', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/worang-client/v1/cache-version`, () => {
          return HttpResponse.json({ code: 'rest_no_route' }, { status: 404 })
        }),
      )

      const client = createClient()
      const version = await client.companion.cacheVersion()
      expect(version).toBeNull()
    })

    it('companion.version() rethrows on 500 (plugin broken, not absent)', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/worang-client/v1/version`, () => {
          return HttpResponse.json({ message: 'boom' }, { status: 500 })
        }),
      )

      const client = createClient()
      await expect(client.companion.version()).rejects.toThrow()
    })
  })
})
