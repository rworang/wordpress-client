import { z } from 'zod'
import { RawFeaturedMediaSchema } from './media'
import { RawCategorySchema } from './category'
import { RawAuthorSchema } from './author'

export const RawPostSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.object({ rendered: z.string() }),
  content: z.object({ rendered: z.string() }),
  excerpt: z.object({ rendered: z.string() }),
  date: z.string(),
  sticky: z.boolean(),
  _embedded: z.object({
    'wp:featuredmedia': z.array(RawFeaturedMediaSchema).optional(),
    'wp:term': z.array(z.array(RawCategorySchema)).optional(),
    author: z.array(RawAuthorSchema).optional(),
  }).optional(),
})
