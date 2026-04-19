export interface PostWritePayload {
    title?: string;
    content?: string;
    excerpt?: string;
    status?: 'publish' | 'draft' | 'pending' | 'private' | 'future';
    slug?: string;
    author?: number;
    featured_media?: number;
    comment_status?: 'open' | 'closed';
    ping_status?: 'open' | 'closed';
    sticky?: boolean;
    template?: string;
    format?: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio';
    categories?: number[];
    tags?: number[];
    meta?: Record<string, unknown>;
    date?: string;
    date_gmt?: string;
    password?: string;
}
export interface PageWritePayload {
    title?: string;
    content?: string;
    excerpt?: string;
    status?: 'publish' | 'draft' | 'pending' | 'private' | 'future';
    slug?: string;
    parent?: number;
    menu_order?: number;
    author?: number;
    featured_media?: number;
    comment_status?: 'open' | 'closed';
    ping_status?: 'open' | 'closed';
    template?: string;
    meta?: Record<string, unknown>;
    date?: string;
    password?: string;
}
export interface TermWritePayload {
    name?: string;
    slug?: string;
    description?: string;
    parent?: number;
    meta?: Record<string, unknown>;
}
export interface MediaWritePayload {
    title?: string;
    alt_text?: string;
    caption?: string;
    description?: string;
    post?: number;
    meta?: Record<string, unknown>;
}
/**
 * Discriminated result of a delete operation.
 *
 * WordPress returns two distinct shapes: a hard delete (`?force=true`) responds
 * with `{ deleted: true, previous }`; a soft delete (`?force=false`) responds
 * with the item itself stamped `status: 'trash'`.
 *
 * Consumers discriminate on the `deleted` flag:
 *
 *     const result = await client.deletePost(id, { force: false })
 *     if (result.deleted) {
 *       // hard delete — result.previous is the removed item
 *     } else {
 *       // soft delete — result.trashed is the item now in trash
 *     }
 */
export type DeleteResult<T> = {
    deleted: true;
    previous: T;
} | {
    deleted: false;
    trashed: T;
};
//# sourceMappingURL=payloads.d.ts.map