import { z } from 'zod'

export const RawAuthorSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
  description: z.string(),
})
