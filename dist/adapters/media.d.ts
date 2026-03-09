/**
 * @internal
 * Transforms raw WordPress media responses into clean Media objects.
 *
 * Flattens the nested media_details structure and converts responsive
 * image sizes into an easy-to-use sizes record. Validates input with Zod.
 */
import type { RawMedia, RawFeaturedMedia } from '../types/raw';
import type { Media } from '../types/domain';
/** @internal Converts a raw WordPress media item to a clean Media object. */
export declare const toMedia: (raw: RawMedia) => Media;
/** @internal Converts embedded featured media to a clean Media object without extra HTTP calls. */
export declare function toMediaFromFeatured(raw?: RawFeaturedMedia): Media | undefined;
//# sourceMappingURL=media.d.ts.map