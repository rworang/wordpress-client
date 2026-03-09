import { z } from 'zod';
export declare const RawMenuItemSchema: z.ZodObject<{
    id: z.ZodNumber;
    title: z.ZodObject<{
        rendered: z.ZodString;
    }, z.core.$strip>;
    url: z.ZodString;
    menus: z.ZodNumber;
    parent: z.ZodNumber;
    menu_order: z.ZodNumber;
    type: z.ZodString;
    object: z.ZodString;
    object_id: z.ZodNumber;
    target: z.ZodString;
}, z.core.$strip>;
export declare const RawNavigationMenuSchema: z.ZodObject<{
    id: z.ZodNumber;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=navigation.d.ts.map