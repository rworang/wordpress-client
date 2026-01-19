/**
 * @internal
 * Transforms raw WordPress category responses into clean Category objects.
 */

import type { RawCategory } from '../types/raw'
import type { Category } from '../types/domain'

/** @internal Converts a raw WordPress category to a clean Category object. */
export const toCategory = (raw: RawCategory): Category => ({
  id: raw.id,
  slug: raw.slug,
  name: raw.name,
  description: raw.description,
  count: raw.count,
})
