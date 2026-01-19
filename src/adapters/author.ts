/**
 * @internal
 * Transforms raw WordPress author responses into clean Author objects.
 */

import type { RawAuthor } from '../types/raw'
import type { Author } from '../types/domain'

/** @internal Converts a raw WordPress author to a clean Author object. */
export const toAuthor = (raw: RawAuthor): Author => ({
  id: raw.id,
  name: raw.name,
  url: raw.url,
  description: raw.description,
})
