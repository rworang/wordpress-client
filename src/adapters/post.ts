/**
 * @internal
 * Transforms raw WordPress post responses into clean Post objects.
 *
 * Extracts embedded author, categories, and featured media from the
 * nested _embedded structure. Automatically hydrates featured media
 * with full image size data.
 */

import type { WordpressClient } from '../client'
import type { RawPost } from '../types/raw'
import type { Post, Author } from '../types/domain'
import { toCategory } from './category'
import { toAuthor } from './author'
import { hydrateMedia } from './media'

const EMPTY_AUTHOR: Author = { id: 0, name: '', url: '', description: '' }

/** @internal Converts a raw WordPress post to a clean Post object. */
export const toPost = async (raw: RawPost, client: WordpressClient): Promise<Post> => {
  const media = raw._embedded?.['wp:featuredmedia']?.[0]
  const cats = raw._embedded?.['wp:term']?.[0] ?? []
  const author = raw._embedded?.['author']?.[0]

  const hydratedMedia = await hydrateMedia(client, media?.id)

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
    featuredMedia: hydratedMedia || undefined,
    date: raw.date,
    categories: cats.map(toCategory),
  }
}
