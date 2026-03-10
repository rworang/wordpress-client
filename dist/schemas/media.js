import { z } from 'zod';
const MediaSizeSchema = z.object({
    file: z.string(),
    width: z.number(),
    height: z.number(),
    filesize: z.number(),
    mime_type: z.string(),
    source_url: z.string(),
});
export const RawMediaSchema = z.object({
    id: z.number(),
    guid: z.object({ rendered: z.string() }),
    alt_text: z.string(),
    type: z.string(),
    description: z.object({ rendered: z.string() }),
    media_type: z.string(),
    mime_type: z.string(),
    media_details: z.object({
        width: z.number(),
        height: z.number(),
        filesize: z.number(),
        sizes: z.record(z.string(), MediaSizeSchema),
    }),
});
const FeaturedMediaSizeSchema = MediaSizeSchema.extend({
    filesize: z.number().optional(),
});
export const RawFeaturedMediaSchema = z.object({
    id: z.number(),
    source_url: z.string(),
    alt_text: z.string(),
    mime_type: z.string().optional(),
    media_details: z.object({
        width: z.number(),
        height: z.number(),
        filesize: z.number().optional(),
        sizes: z.record(z.string(), FeaturedMediaSizeSchema),
    }).optional(),
});
//# sourceMappingURL=media.js.map