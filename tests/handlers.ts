import { http, HttpResponse } from 'msw'
import {
  rawPost,
  rawPage,
  rawMedia,
  rawCategory,
  rawTag,
  rawNavigationMenu,
  rawMenuItem,
  rawAuthor,
} from './fixtures/raw'

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
      return HttpResponse.json({ code: 'rest_post_invalid_id', message: 'Invalid post ID.' }, { status: 404 })
    }
    return HttpResponse.json(rawPost)
  }),

  // Create post
  http.post(`${BASE}/wp/v2/posts`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>

    return HttpResponse.json({
      ...rawPost,
      id: 101,
      slug: typeof body.slug === 'string' ? body.slug : rawPost.slug,
      title: { rendered: typeof body.title === 'string' ? body.title : rawPost.title.rendered },
      content: { rendered: typeof body.content === 'string' ? body.content : rawPost.content.rendered },
      excerpt: { rendered: typeof body.excerpt === 'string' ? body.excerpt : rawPost.excerpt.rendered },
      sticky: typeof body.sticky === 'boolean' ? body.sticky : rawPost.sticky,
    })
  }),

  // Update post
  http.post(`${BASE}/wp/v2/posts/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>

    return HttpResponse.json({
      ...rawPost,
      id: Number(params.id),
      slug: typeof body.slug === 'string' ? body.slug : rawPost.slug,
      title: { rendered: typeof body.title === 'string' ? body.title : rawPost.title.rendered },
      content: { rendered: typeof body.content === 'string' ? body.content : rawPost.content.rendered },
      excerpt: { rendered: typeof body.excerpt === 'string' ? body.excerpt : rawPost.excerpt.rendered },
      sticky: typeof body.sticky === 'boolean' ? body.sticky : rawPost.sticky,
    })
  }),

  // Delete post
  http.delete(`${BASE}/wp/v2/posts/:id`, () => {
    return HttpResponse.json({ deleted: true, previous: rawPost })
  }),

  // Pages list
  http.get(`${BASE}/wp/v2/pages`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (slug === 'not-found') {
      return HttpResponse.json([])
    }

    if (slug) {
      return HttpResponse.json([rawPage], {
        headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
      })
    }

    return HttpResponse.json([rawPage], {
      headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
    })
  }),

  // Single page by ID
  http.get(`${BASE}/wp/v2/pages/:id`, ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json({ code: 'rest_post_invalid_id', message: 'Invalid page ID.' }, { status: 404 })
    }
    return HttpResponse.json(rawPage)
  }),

  // Create page
  http.post(`${BASE}/wp/v2/pages`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>

    return HttpResponse.json({
      ...rawPage,
      id: 202,
      slug: typeof body.slug === 'string' ? body.slug : rawPage.slug,
      title: { rendered: typeof body.title === 'string' ? body.title : rawPage.title.rendered },
      content: { rendered: typeof body.content === 'string' ? body.content : rawPage.content.rendered },
      excerpt: { rendered: typeof body.excerpt === 'string' ? body.excerpt : rawPage.excerpt.rendered },
      parent: typeof body.parent === 'number' ? body.parent : rawPage.parent,
      menu_order: typeof body.menu_order === 'number' ? body.menu_order : rawPage.menu_order,
    })
  }),

  // Update page
  http.post(`${BASE}/wp/v2/pages/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>

    return HttpResponse.json({
      ...rawPage,
      id: Number(params.id),
      slug: typeof body.slug === 'string' ? body.slug : rawPage.slug,
      title: { rendered: typeof body.title === 'string' ? body.title : rawPage.title.rendered },
      content: { rendered: typeof body.content === 'string' ? body.content : rawPage.content.rendered },
      excerpt: { rendered: typeof body.excerpt === 'string' ? body.excerpt : rawPage.excerpt.rendered },
      parent: typeof body.parent === 'number' ? body.parent : rawPage.parent,
      menu_order: typeof body.menu_order === 'number' ? body.menu_order : rawPage.menu_order,
    })
  }),

  // Delete page
  http.delete(`${BASE}/wp/v2/pages/:id`, () => {
    return HttpResponse.json({ deleted: true, previous: rawPage })
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

  // Create category
  http.post(`${BASE}/wp/v2/categories`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>

    return HttpResponse.json({
      ...rawCategory,
      id: 303,
      slug: typeof body.slug === 'string' ? body.slug : rawCategory.slug,
      name: typeof body.name === 'string' ? body.name : rawCategory.name,
      description: typeof body.description === 'string' ? body.description : rawCategory.description,
    })
  }),

  // Update category
  http.post(`${BASE}/wp/v2/categories/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>

    return HttpResponse.json({
      ...rawCategory,
      id: Number(params.id),
      slug: typeof body.slug === 'string' ? body.slug : rawCategory.slug,
      name: typeof body.name === 'string' ? body.name : rawCategory.name,
      description: typeof body.description === 'string' ? body.description : rawCategory.description,
    })
  }),

  // Delete category
  http.delete(`${BASE}/wp/v2/categories/:id`, () => {
    return HttpResponse.json({ deleted: true, previous: rawCategory })
  }),

  // Tags list
  http.get(`${BASE}/wp/v2/tags`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (slug === 'not-found') {
      return HttpResponse.json([])
    }

    return HttpResponse.json([rawTag], {
      headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
    })
  }),

  // Create tag
  http.post(`${BASE}/wp/v2/tags`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>

    return HttpResponse.json({
      ...rawTag,
      id: 404,
      slug: typeof body.slug === 'string' ? body.slug : rawTag.slug,
      name: typeof body.name === 'string' ? body.name : rawTag.name,
      description: typeof body.description === 'string' ? body.description : rawTag.description,
    })
  }),

  // Update tag
  http.post(`${BASE}/wp/v2/tags/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>

    return HttpResponse.json({
      ...rawTag,
      id: Number(params.id),
      slug: typeof body.slug === 'string' ? body.slug : rawTag.slug,
      name: typeof body.name === 'string' ? body.name : rawTag.name,
      description: typeof body.description === 'string' ? body.description : rawTag.description,
    })
  }),

  // Delete tag
  http.delete(`${BASE}/wp/v2/tags/:id`, () => {
    return HttpResponse.json({ deleted: true, previous: rawTag })
  }),

  // Users list
  http.get(`${BASE}/wp/v2/users`, ({ request }) => {
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (slug === 'not-found') {
      return HttpResponse.json([])
    }

    return HttpResponse.json([rawAuthor], {
      headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
    })
  }),

  // User by ID
  http.get(`${BASE}/wp/v2/users/:id`, ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json({ code: 'rest_user_invalid_id', message: 'Invalid user ID.' }, { status: 404 })
    }
    return HttpResponse.json({ ...rawAuthor, id: Number(params.id) })
  }),

  // Media by ID
  http.get(`${BASE}/wp/v2/media/:id`, ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json({ code: 'rest_post_invalid_id', message: 'Invalid media ID.' }, { status: 404 })
    }
    return HttpResponse.json(rawMedia)
  }),

  // Media list
  http.get(`${BASE}/wp/v2/media`, () => {
    return HttpResponse.json([rawMedia], {
      headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
    })
  }),

  // Upload media (binary)
  http.post(`${BASE}/wp/v2/media`, () => {
    return HttpResponse.json({ ...rawMedia, id: 505 })
  }),

  // Update media metadata
  http.post(`${BASE}/wp/v2/media/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      ...rawMedia,
      id: Number(params.id),
      alt_text: typeof body.alt_text === 'string' ? body.alt_text : rawMedia.alt_text,
    })
  }),

  // Delete media
  http.delete(`${BASE}/wp/v2/media/:id`, () => {
    return HttpResponse.json({ deleted: true, previous: rawMedia })
  }),

  // Navigation menus
  http.get(`${BASE}/wp/v2/menus`, () => {
    return HttpResponse.json([rawNavigationMenu], {
      headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' },
    })
  }),

  // Menu items
  http.get(`${BASE}/wp/v2/menu-items`, () => {
    return HttpResponse.json([rawMenuItem], {
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
