import { z } from 'zod'
import { RawFeaturedMediaSchema } from './media'
import { RawCategorySchema } from './category'
import { RawTagSchema } from './tag'
import { RawAuthorSchema } from './author'

export const RawPostSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.object({ rendered: z.string() }),
  content: z.object({ rendered: z.string() }),
  excerpt: z.object({ rendered: z.string() }),
  date: z.string(),
  sticky: z.boolean(),
  _embedded: z
    .object({
      'wp:featuredmedia': z.array(RawFeaturedMediaSchema).optional(),
      // WordPress may omit later taxonomy buckets, but the first bucket is categories and any
      // remaining buckets are tag-like term arrays consumed by the post adapter.
      'wp:term': z
        .tuple([z.array(RawCategorySchema)])
        .rest(z.array(RawTagSchema))
        .optional(),
      author: z.array(RawAuthorSchema).optional(),
    })
    .optional(),
})
