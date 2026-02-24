/**
 * @internal
 * Transforms raw WordPress media responses into clean Media objects.
 *
 * Flattens the nested media_details structure and converts responsive
 * image sizes into an easy-to-use sizes record. Validates input with Zod.
 */
import type { WordpressClient } from '../client';
import type { RawMedia, RawFeaturedMedia } from '../types/raw';
import type { Media } from '../types/domain';
/** @internal Converts a raw WordPress media item to a clean Media object. */
export declare const toMedia: (raw: RawMedia) => Media;
/** @internal Converts embedded featured media to a clean Media object without extra HTTP calls. */
export declare function toMediaFromFeatured(raw?: RawFeaturedMedia): Media | undefined;
/**
 * @deprecated Use `toMediaFromFeatured` instead — it avoids the extra HTTP call
 * by using embedded media data from `_embed`.
 * @internal Fetches full media details for a media ID.
 */
export declare function hydrateMedia(client: WordpressClient, id?: number): Promise<Media | null>;
//# sourceMappingURL=media.d.ts.map