/**
 * @internal
 * Transforms raw WordPress post responses into clean Post objects.
 *
 * Extracts embedded author, categories, and featured media from the
 * nested _embedded structure. Automatically hydrates featured media
 * with full image size data.
 */
import type { WordpressClient } from '../client';
import type { RawPost } from '../types/raw';
import type { Post } from '../types/domain';
/** @internal Converts a raw WordPress post to a clean Post object. */
export declare const toPost: (raw: RawPost, client: WordpressClient) => Promise<Post>;
//# sourceMappingURL=post.d.ts.map