import { z } from 'zod';
export declare const RawCategorySchema: z.ZodObject<{
    id: z.ZodNumber;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    count: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
//# sourceMappingURL=category.d.ts.map