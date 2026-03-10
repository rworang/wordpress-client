import type {
  RawPost,
  RawPage,
  RawMedia,
  RawCategory,
  RawTag,
  RawMenuItem,
  RawNavigationMenu,
  RawAuthor,
  RawFeaturedMedia,
} from '../../src/types/raw'

export const rawAuthor: RawAuthor = {
  id: 1,
  name: 'Jane Doe',
  url: 'https://example.com',
  description: 'A test author',
}

export const rawCategory: RawCategory = {
  id: 5,
  slug: 'tech',
  name: 'Technology',
  description: 'Tech posts',
  count: 12,
}

export const rawTag: RawTag = {
  id: 8,
  slug: 'javascript',
  name: 'JavaScript',
  description: 'JavaScript posts',
  count: 7,
}

export const rawFeaturedMedia: RawFeaturedMedia = {
  id: 10,
  source_url: 'https://example.com/image.jpg',
  alt_text: 'Test image',
  mime_type: 'image/jpeg',
  media_details: {
    width: 1200,
    height: 800,
    sizes: {
      thumbnail: {
        file: 'image-150x150.jpg',
        width: 150,
        height: 150,
        mime_type: 'image/jpeg',
        source_url: 'https://example.com/image-150x150.jpg',
      },
    },
  },
}

export const rawMedia: RawMedia = {
  id: 10,
  guid: { rendered: 'https://example.com/image.jpg' },
  alt_text: 'Test image alt',
  type: 'attachment',
  description: { rendered: 'A test image caption' },
  media_type: 'image',
  mime_type: 'image/jpeg',
  media_details: {
    width: 1200,
    height: 800,
    filesize: 50000,
    sizes: {
      thumbnail: {
        file: 'image-150x150.jpg',
        width: 150,
        height: 150,
        filesize: 5000,
        mime_type: 'image/jpeg',
        source_url: 'https://example.com/image-150x150.jpg',
      },
    },
  },
}

export const rawPost: RawPost = {
  id: 1,
  slug: 'hello-world',
  title: { rendered: 'Hello World' },
  content: { rendered: '<p>Hello world content</p>' },
  excerpt: { rendered: '<p>Hello world excerpt</p>' },
  date: '2024-01-15T10:00:00',
  sticky: false,
  _embedded: {
    'wp:featuredmedia': [rawFeaturedMedia],
    'wp:term': [[rawCategory], [rawTag]],
    author: [rawAuthor],
  },
}

export const rawPage: RawPage = {
  id: 2,
  slug: 'about',
  title: { rendered: 'About Us' },
  content: { rendered: '<p>About us content</p>' },
  excerpt: { rendered: '<p>About us excerpt</p>' },
  date: '2024-01-10T08:00:00',
  parent: 0,
  menu_order: 1,
  _embedded: {
    'wp:featuredmedia': [rawFeaturedMedia],
    author: [rawAuthor],
  },
}

export const rawNavigationMenu: RawNavigationMenu = {
  id: 3,
  name: 'Main Menu',
  slug: 'main-menu',
  description: 'Primary navigation',
}

export const rawMenuItem: RawMenuItem = {
  id: 10,
  title: { rendered: 'About' },
  url: 'https://example.com/about',
  menus: 3,
  parent: 0,
  menu_order: 1,
  type: 'post_type',
  object: 'page',
  object_id: 2,
  target: '',
}
