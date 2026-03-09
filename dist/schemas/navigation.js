import { z } from 'zod';
export const RawMenuItemSchema = z.object({
    id: z.number(),
    title: z.object({ rendered: z.string() }),
    url: z.string(),
    menus: z.number(),
    parent: z.number(),
    menu_order: z.number(),
    type: z.string(),
    object: z.string(),
    object_id: z.number(),
    target: z.string(),
});
export const RawNavigationMenuSchema = z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    description: z.string(),
});
//# sourceMappingURL=navigation.js.map