import { http, HttpResponse } from 'msw'
import { rawPost, rawMedia, rawCategory } from './fixtures/raw'

const BASE = 'https://test.wp.com/wp-json'

export const handlers = [
  // Posts list
  http.get(`${BASE}/wp/v2/posts`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (slug === 'not-found') {
      return HttpResponse.json([])
    }

    if (slug) {
      return HttpResponse.json([rawPost], {
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      })
    }

    return HttpResponse.json([rawPost], {
      headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
    })
  }),

  // Single post by ID
  http.get(`${BASE}/wp/v2/posts/:id`, ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json(
        { code: 'rest_post_invalid_id', message: 'Invalid post ID.' },
        { status: 404 },
      )
    }
    return HttpResponse.json(rawPost)
  }),

  // Categories list
  http.get(`${BASE}/wp/v2/categories`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (slug === 'not-found') {
      return HttpResponse.json([])
    }

    return HttpResponse.json([rawCategory], {
      headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
    })
  }),

  // Media by ID
  http.get(`${BASE}/wp/v2/media/:id`, ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json(
        { code: 'rest_post_invalid_id', message: 'Invalid media ID.' },
        { status: 404 },
      )
    }
    return HttpResponse.json(rawMedia)
  }),

  // Media list
  http.get(`${BASE}/wp/v2/media`, () => {
    return HttpResponse.json([rawMedia], {
      headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
    })
  }),

  // Auth error
  http.get(`${BASE}/wp/v2/private`, () => {
    return HttpResponse.json(
      { code: 'rest_forbidden', message: 'Sorry, you are not allowed to do that.' },
      { status: 403 },
    )
  }),

  // Cache version
  http.get(`${BASE}/worang/v1/cache-version`, () => {
    return HttpResponse.json({ version: 'v42' })
  }),
]
