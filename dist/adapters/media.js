/**
 * @internal
 * Transforms raw WordPress media responses into clean Media objects.
 *
 * Flattens the nested media_details structure and converts responsive
 * image sizes into an easy-to-use sizes record. Validates input with Zod.
 */
import { RawMediaSchema } from '../schemas/media';
import { WordpressSchemaError } from '../errors';
/** @internal Converts a raw WordPress media item to a clean Media object. */
export const toMedia = (raw) => {
    const result = RawMediaSchema.safeParse(raw);
    if (!result.success) {
        throw new WordpressSchemaError('media', result.error.issues);
    }
    return {
        id: raw.id,
        url: raw.guid.rendered,
        alt: raw.description?.rendered ?? '',
        mimeType: raw.mime_type,
        width: raw.media_details.width,
        height: raw.media_details.height,
        sizes: Object.fromEntries(Object.entries(raw.media_details.sizes ?? {}).map(([key, size]) => [
            key,
            {
                url: size.source_url,
                width: size.width,
                height: size.height,
                mimeType: size.mime_type,
                filesize: size.filesize,
            },
        ])),
    };
};
/** @internal Converts embedded featured media to a clean Media object without extra HTTP calls. */
export function toMediaFromFeatured(raw) {
    if (!raw?.media_details)
        return undefined;
    return {
        id: raw.id,
        url: raw.source_url,
        alt: raw.alt_text ?? '',
        mimeType: raw.mime_type ?? '',
        width: raw.media_details.width,
        height: raw.media_details.height,
        sizes: Object.fromEntries(Object.entries(raw.media_details.sizes ?? {}).map(([key, size]) => [
            key,
            {
                url: size.source_url,
                width: size.width,
                height: size.height,
                mimeType: size.mime_type,
                filesize: size.filesize,
            },
        ])),
    };
}
/**
 * @deprecated Use `toMediaFromFeatured` instead — it avoids the extra HTTP call
 * by using embedded media data from `_embed`.
 * @internal Fetches full media details for a media ID.
 */
export async function hydrateMedia(client, id) {
    if (!id)
        return null;
    try {
        const media = await client.media(id);
        return media;
    }
    catch (error) {
        console.warn('Failed to hydrate media', id, error);
        return null;
    }
}
//# sourceMappingURL=media.js.map