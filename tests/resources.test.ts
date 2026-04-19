import { describe, it, expect } from 'vitest'
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { server } from './server'
import { WordpressClient } from '../src/client'
import { WordpressAuthError, WordpressSchemaError } from '../src/errors'

const BASE_URL = 'https://test.wp.com'

interface Widget {
  id: number
  name: string
}

interface WidgetPayload {
  name: string
}

interface SiteConfig {
  title: string
  tagline: string
}

interface SiteConfigPayload {
  title: string
  tagline?: string
}

describe('defineResource', () => {
  describe('full CRUD resource', () => {
    it('supports list / get / create / update / delete round-trip', async () => {
      const store: Widget[] = [{ id: 1, name: 'First' }]

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets`, () => {
          return HttpResponse.json(store, {
            headers: { 'x-wp-total': String(store.length), 'x-wp-totalpages': '1' },
          })
        }),
        http.get(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets/:id`, ({ params }) => {
          const found = store.find((w) => w.id === Number(params.id))
          return HttpResponse.json(found)
        }),
        http.post(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets`, async ({ request }) => {
          const body = (await request.json()) as WidgetPayload
          const item = { id: store.length + 1, name: body.name }
          store.push(item)
          return HttpResponse.json(item)
        }),
        http.post(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets/:id`, async ({ request, params }) => {
          const body = (await request.json()) as Partial<WidgetPayload>
          const item = store.find((w) => w.id === Number(params.id))!
          if (body.name !== undefined) item.name = body.name
          return HttpResponse.json(item)
        }),
        http.delete(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets/:id`, ({ params }) => {
          const idx = store.findIndex((w) => w.id === Number(params.id))
          const [previous] = store.splice(idx, 1)
          return HttpResponse.json({ deleted: true, previous })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const widgets = client.defineResource<Widget, WidgetPayload>({ path: '/worang/v1/widgets' })

      const listed = await widgets.list()
      expect(listed.data).toHaveLength(1)

      const one = await widgets.get(1)
      expect(one.name).toBe('First')

      const created = await widgets.create({ name: 'Second' })
      expect(created.id).toBe(2)
      expect(created.name).toBe('Second')

      const updated = await widgets.update(2, { name: 'Renamed' })
      expect(updated.name).toBe('Renamed')

      const deleted = await widgets.delete(2)
      expect(deleted.deleted).toBe(true)
      expect(deleted.previous.name).toBe('Renamed')
    })

    it('get(slug) resolves via ?slug= query', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets`, ({ request }) => {
          const slug = new URL(request.url).searchParams.get('slug')
          if (slug === 'found') {
            return HttpResponse.json([{ id: 99, name: 'Found' }])
          }
          return HttpResponse.json([])
        }),
      )

      const client = new WordpressClient({ baseURL: BASE_URL, retry: { retries: 0 } })
      const widgets = client.defineResource<Widget, WidgetPayload>({ path: '/worang/v1/widgets' })

      const found = await widgets.get('found')
      expect(found.id).toBe(99)

      await expect(widgets.get('missing')).rejects.toThrow(WordpressSchemaError)
    })

    it('enforces auth on writes', async () => {
      const client = new WordpressClient({ baseURL: BASE_URL, retry: { retries: 0 } })
      const widgets = client.defineResource<Widget, WidgetPayload>({ path: '/worang/v1/widgets' })

      await expect(widgets.create({ name: 'x' })).rejects.toThrow(WordpressAuthError)
      await expect(widgets.update(1, { name: 'x' })).rejects.toThrow(WordpressAuthError)
      await expect(widgets.delete(1)).rejects.toThrow(WordpressAuthError)
    })

    it('busts extra invalidation prefixes after a create', async () => {
      let fooCount = 0
      let barCount = 0

      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/foo`, () => {
          fooCount++
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
        http.get(`${BASE_URL}/wp-json/wp/v2/bar`, () => {
          barCount++
          return HttpResponse.json([], {
            headers: { 'x-wp-total': '0', 'x-wp-totalpages': '1' },
          })
        }),
        http.post(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets`, () => HttpResponse.json({ id: 1, name: 'x' })),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        cache: { ttl: 5000 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      await client.request({ method: 'GET', path: '/foo' })
      await client.request({ method: 'GET', path: '/bar' })

      const widgets = client.defineResource<Widget, WidgetPayload>({
        path: '/worang/v1/widgets',
        invalidates: ['/foo', '/bar'],
      })
      await widgets.create({ name: 'x' })

      await client.request({ method: 'GET', path: '/foo' })
      await client.request({ method: 'GET', path: '/bar' })

      expect(fooCount).toBe(2)
      expect(barCount).toBe(2)
    })

    it('validates responses against itemSchema and throws WordpressSchemaError on mismatch', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets/:id`, () => {
          return HttpResponse.json({ id: 'not-a-number', name: 'x' })
        }),
      )

      const client = new WordpressClient({ baseURL: BASE_URL, retry: { retries: 0 } })
      const schema = z.object({ id: z.number(), name: z.string() })
      const widgets = client.defineResource<Widget, WidgetPayload>({
        path: '/worang/v1/widgets',
        itemSchema: schema,
      })

      await expect(widgets.get(1)).rejects.toThrow(WordpressSchemaError)
    })

    it('routes through the site base when base: "site" is set', async () => {
      let hitSite = false
      server.use(
        http.get(`${BASE_URL}/wp-json/worang/v1/site-things`, () => {
          hitSite = true
          return HttpResponse.json([])
        }),
      )

      const client = new WordpressClient({ baseURL: BASE_URL, retry: { retries: 0 } })
      const siteThings = client.defineResource<Widget, WidgetPayload>({
        path: '/worang/v1/site-things',
        base: 'site',
      })

      await siteThings.list()
      expect(hitSite).toBe(true)
    })

    it('threads custom pagination params through to the request', async () => {
      let observedPerPage: string | null = null
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/worang/v1/widgets`, ({ request }) => {
          observedPerPage = new URL(request.url).searchParams.get('per_page')
          return HttpResponse.json([])
        }),
      )

      const client = new WordpressClient({ baseURL: BASE_URL, retry: { retries: 0 } })
      const widgets = client.defineResource<Widget, WidgetPayload>({ path: '/worang/v1/widgets' })

      await widgets.list({ per_page: 5 })
      expect(observedPerPage).toBe('5')
    })
  })

  describe('singleton resource', () => {
    it('exposes only get and update', async () => {
      server.use(
        http.get(`${BASE_URL}/wp-json/wp/v2/worang/v1/site-config`, () => {
          return HttpResponse.json({ title: 'My Site', tagline: 'Welcome' })
        }),
        http.post(`${BASE_URL}/wp-json/wp/v2/worang/v1/site-config`, async ({ request }) => {
          const body = (await request.json()) as Partial<SiteConfigPayload>
          return HttpResponse.json({ title: body.title ?? 'My Site', tagline: body.tagline ?? 'Welcome' })
        }),
      )

      const client = new WordpressClient({
        baseURL: BASE_URL,
        retry: { retries: 0 },
        auth: { username: 'alice', appPassword: 'secret' },
      })

      const siteConfig = client.defineResource<SiteConfig, SiteConfigPayload>({
        path: '/worang/v1/site-config',
        singleton: true,
      })

      const current = await siteConfig.get()
      expect(current.title).toBe('My Site')

      const updated = await siteConfig.update({ title: 'New Title' })
      expect(updated.title).toBe('New Title')

      // Runtime shape check: list/create/delete are not exposed on singleton return type
      expect('list' in siteConfig).toBe(false)
      expect('create' in siteConfig).toBe(false)
      expect('delete' in siteConfig).toBe(false)
    })
  })
})
