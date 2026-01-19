/**
 * WP REST API base types
 */
export interface RawMedia {
    id: number;
    guid: {
        rendered: string;
    };
    type: string;
    description: {
        rendered: string;
    };
    media_type: string;
    mime_type: string;
    media_details: {
        width: number;
        height: number;
        filesize: number;
        sizes: Record<string, {
            file: string;
            width: number;
            height: number;
            filesize: number;
            mime_type: string;
            source_url: string;
        }>;
    };
}
export interface RawFeaturedMedia {
    id: number;
    source_url: string;
    alt_text: string;
    mime_type?: string;
    media_details?: {
        width: number;
        height: number;
        filesize?: number;
        sizes: Record<string, {
            file: string;
            width: number;
            height: number;
            filesize?: number;
            mime_type: string;
            source_url: string;
        }>;
    };
}
export interface RawCategory {
    id: number;
    slug: string;
    name: string;
    description: string;
    count: number;
}
export interface RawAuthor {
    id: number;
    name: string;
    url: string;
    description: string;
}
export interface RawPost {
    id: number;
    slug: string;
    title: {
        rendered: string;
    };
    content: {
        rendered: string;
    };
    excerpt: {
        rendered: string;
    };
    date: string;
    _embedded?: {
        'wp:featuredmedia'?: RawFeaturedMedia[];
        'wp:term'?: RawCategory[][];
        author?: RawAuthor[];
    };
}
//# sourceMappingURL=raw.d.ts.map