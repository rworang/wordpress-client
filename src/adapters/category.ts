import type { RawCategory } from '../types/raw'
import type { Category } from '../types/domain'

export const toCategory = (raw: RawCategory): Category => ({
  id: raw.id,
  slug: raw.slug,
  name: raw.name,
  description: raw.description,
  count: raw.count,
})
