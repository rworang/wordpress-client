/**
 * @internal
 * Transforms raw WordPress category responses into clean Category objects.
 * Validates input with Zod.
 */

import type { RawCategory } from '../types/raw'
import type { Category } from '../types/domain'
import { RawCategorySchema } from '../schemas/category'
import { WordpressSchemaError } from '../errors'

/** @internal Converts a raw WordPress category to a clean Category object. */
export const toCategory = (raw: RawCategory): Category => {
  const result = RawCategorySchema.safeParse(raw)
  if (!result.success) {
    throw new WordpressSchemaError('category', result.error.issues)
  }

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    count: raw.count,
  }
}
