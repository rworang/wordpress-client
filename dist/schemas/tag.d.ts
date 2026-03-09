import { z } from 'zod';
export declare const RawTagSchema: z.ZodObject<{
    id: z.ZodNumber;
    slug: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    count: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
//# sourceMappingURL=tag.d.ts.map