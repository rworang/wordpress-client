/**
 * Query parameters for filtering and paginating API requests.
 *
 * @example
 * // Get posts from category 5, newest first
 * client.posts({ categories: [5], orderby: 'date', order: 'desc' })
 *
 * @example
 * // Search posts
 * client.posts({ search: 'typescript', per_page: 5 })
 *
 * @example
 * // Get categories with posts, sorted by name
 * client.categories({ hide_empty: true, orderby: 'name' })
 */

export interface PostQueryParams {
  page?: number
  per_page?: number
  search?: string
  categories?: number[]
  categories_exclude?: number[]
  tags?: number[]
  tags_exclude?: number[]
  author?: number
  orderby?: 'date' | 'title' | 'slug' | 'author' | 'modified' | 'relevance'
  order?: 'asc' | 'desc'
  before?: string
  after?: string
  slug?: string | string[]
  status?: 'publish' | 'draft' | 'pending' | 'private' | 'any'
}

export interface TaxonomyQueryParams {
  page?: number
  per_page?: number
  search?: string
  slug?: string | string[]
  hide_empty?: boolean
  orderby?: 'id' | 'name' | 'slug' | 'count'
  order?: 'asc' | 'desc'
}

export interface MediaQueryParams {
  page?: number
  per_page?: number
  search?: string
  media_type?: 'image' | 'video' | 'audio' | 'application'
  mime_type?: string
  orderby?: 'date' | 'title' | 'id'
  order?: 'asc' | 'desc'
}
