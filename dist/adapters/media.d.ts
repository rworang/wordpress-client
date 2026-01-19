/**
 * @internal
 * Transforms raw WordPress media responses into clean Media objects.
 *
 * Flattens the nested media_details structure and converts responsive
 * image sizes into an easy-to-use sizes record.
 */
import type { WordpressClient } from '../client';
import type { RawMedia } from '../types/raw';
import type { Media } from '../types/domain';
/** @internal Converts a raw WordPress media item to a clean Media object. */
export declare const toMedia: (raw: RawMedia) => Media;
/** @internal Fetches full media details for a media ID. */
export declare function hydrateMedia(client: WordpressClient, id?: number): Promise<Media | null>;
//# sourceMappingURL=media.d.ts.map