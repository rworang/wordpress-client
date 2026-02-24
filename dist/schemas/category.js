import { z } from 'zod';
export const RawCategorySchema = z.object({
    id: z.number(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    count: z.number(),
});
//# sourceMappingURL=category.js.map