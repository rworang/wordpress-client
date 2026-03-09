import { z } from 'zod'

export const RawTagSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().optional(),
  count: z.number().optional(),
})
