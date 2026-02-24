/**
 * @internal
 * Transforms raw WordPress post responses into clean Post objects.
 *
 * Extracts embedded author, categories, and featured media from the
 * nested _embedded structure. Uses embedded media data directly
 * without extra HTTP calls.
 */
import type { RawPost } from '../types/raw';
import type { Post } from '../types/domain';
/** @internal Converts a raw WordPress post to a clean Post object. */
export declare const toPost: (raw: RawPost) => Post;
//# sourceMappingURL=post.d.ts.map