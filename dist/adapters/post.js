/**
 * @internal
 * Transforms raw WordPress post responses into clean Post objects.
 *
 * Extracts embedded author, categories, and featured media from the
 * nested _embedded structure. Uses embedded media data directly
 * without extra HTTP calls.
 */
import { toCategory } from './category';
import { toAuthor } from './author';
import { toMediaFromFeatured } from './media';
const EMPTY_AUTHOR = { id: 0, name: '', url: '', description: '' };
/** @internal Converts a raw WordPress post to a clean Post object. */
export const toPost = (raw) => {
    const media = raw._embedded?.['wp:featuredmedia']?.[0];
    const cats = raw._embedded?.['wp:term']?.[0] ?? [];
    const author = raw._embedded?.['author']?.[0];
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
        categories: cats.map(toCategory),
        sticky: raw.sticky ?? false,
    };
};
//# sourceMappingURL=post.js.map