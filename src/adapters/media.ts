/**
 * @internal
 * Transforms raw WordPress media responses into clean Media objects.
 *
 * Flattens the nested media_details structure and converts responsive
 * image sizes into an easy-to-use sizes record. Validates input with Zod.
 */

import type { RawMedia, RawFeaturedMedia } from '../types/raw'
import type { Media } from '../types/domain'
import { RawMediaSchema, RawFeaturedMediaSchema } from '../schemas/media'
import { WordpressSchemaError } from '../errors'

/** @internal Converts a raw WordPress media item to a clean Media object. */
export const toMedia = (raw: RawMedia): Media => {
  const result = RawMediaSchema.safeParse(raw)
  if (!result.success) {
    throw new WordpressSchemaError('media', result.error.issues)
  }

  return {
    id: raw.id,
    url: raw.guid.rendered,
    alt: raw.description.rendered,
    mimeType: raw.mime_type,
    width: raw.media_details.width,
    height: raw.media_details.height,
    sizes: Object.fromEntries(
      Object.entries(raw.media_details.sizes ?? {}).map(([key, size]) => [
        key,
        {
          url: size.source_url,
          width: size.width,
          height: size.height,
          mimeType: size.mime_type,
          filesize: size.filesize,
        },
      ]),
    ),
  }
}

/** @internal Converts embedded featured media to a clean Media object without extra HTTP calls. */
export function toMediaFromFeatured(raw?: RawFeaturedMedia): Media | undefined {
  if (!raw?.media_details) return undefined

  const result = RawFeaturedMediaSchema.safeParse(raw)
  if (!result.success) {
    throw new WordpressSchemaError('featured media', result.error.issues)
  }

  return {
    id: raw.id,
    url: raw.source_url,
    alt: raw.alt_text ?? '',
    mimeType: raw.mime_type ?? '',
    width: raw.media_details.width,
    height: raw.media_details.height,
    sizes: Object.fromEntries(
      Object.entries(raw.media_details.sizes ?? {}).map(([key, size]) => [
        key,
        {
          url: size.source_url,
          width: size.width,
          height: size.height,
          mimeType: size.mime_type,
          filesize: size.filesize,
        },
      ]),
    ),
  }
}
