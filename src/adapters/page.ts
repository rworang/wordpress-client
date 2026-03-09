/**
 * @internal
 * Transforms raw WordPress page responses into clean Page objects.
 *
 * Pages are structurally similar to posts but include parent hierarchy
 * and menu ordering instead of categories and sticky status.
 */

import type { RawPage } from '../types/raw'
import type { Page, Author } from '../types/domain'
import { RawPageSchema } from '../schemas/page'
import { WordpressSchemaError } from '../errors'
import { toAuthor } from './author'
import { toMediaFromFeatured } from './media'

const EMPTY_AUTHOR: Author = { id: 0, name: '', url: '', description: '' }

/** @internal Converts a raw WordPress page to a clean Page object. */
export const toPage = (raw: RawPage): Page => {
  const result = RawPageSchema.safeParse(raw)
  if (!result.success) {
    throw new WordpressSchemaError('page', result.error.issues)
  }

  const media = raw._embedded?.['wp:featuredmedia']?.[0]
  const author = raw._embedded?.['author']?.[0]

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title?.rendered ?? '',
    author: author ? toAuthor(author) : EMPTY_AUTHOR,
    content: raw.content?.rendered ?? '',
    excerpt: raw.excerpt?.rendered ?? '',
    featuredImage: {
      id: media?.id,
      url: media?.source_url ?? '',
      alt: media?.alt_text ?? '',
    },
    featuredMedia: toMediaFromFeatured(media),
    date: raw.date,
    parent: raw.parent,
    menuOrder: raw.menu_order,
  }
}
