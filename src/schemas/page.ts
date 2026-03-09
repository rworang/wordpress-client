import { z } from 'zod'
import { RawFeaturedMediaSchema } from './media'
import { RawAuthorSchema } from './author'

export const RawPageSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.object({ rendered: z.string() }),
  content: z.object({ rendered: z.string() }),
  excerpt: z.object({ rendered: z.string() }),
  date: z.string(),
  parent: z.number(),
  menu_order: z.number(),
  _embedded: z.object({
    'wp:featuredmedia': z.array(RawFeaturedMediaSchema).optional(),
    author: z.array(RawAuthorSchema).optional(),
  }).optional(),
})
