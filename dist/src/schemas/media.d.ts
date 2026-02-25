import { z } from 'zod';
export declare const RawMediaSchema: z.ZodObject<{
    id: z.ZodNumber;
    guid: z.ZodObject<{
        rendered: z.ZodString;
    }, z.core.$strip>;
    type: z.ZodString;
    description: z.ZodObject<{
        rendered: z.ZodString;
    }, z.core.$strip>;
    media_type: z.ZodString;
    mime_type: z.ZodString;
    media_details: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        filesize: z.ZodNumber;
        sizes: z.ZodRecord<z.ZodString, z.ZodObject<{
            file: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            filesize: z.ZodNumber;
            mime_type: z.ZodString;
            source_url: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const RawFeaturedMediaSchema: z.ZodObject<{
    id: z.ZodNumber;
    source_url: z.ZodString;
    alt_text: z.ZodString;
    mime_type: z.ZodOptional<z.ZodString>;
    media_details: z.ZodOptional<z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        filesize: z.ZodOptional<z.ZodNumber>;
        sizes: z.ZodRecord<z.ZodString, z.ZodObject<{
            file: z.ZodString;
            width: z.ZodNumber;
            height: z.ZodNumber;
            mime_type: z.ZodString;
            source_url: z.ZodString;
            filesize: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
//# sourceMappingURL=media.d.ts.map