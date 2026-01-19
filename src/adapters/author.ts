/** Transforms raw WordPress author responses into clean Author objects (internal). */

import type { RawAuthor } from '../types/raw'
import type { Author } from '../types/domain'

export const toAuthor = (raw: RawAuthor): Author => ({
  id: raw.id,
  name: raw.name,
  url: raw.url,
  description: raw.description,
})
