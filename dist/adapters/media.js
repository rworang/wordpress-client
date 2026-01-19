export const toMedia = (raw) => ({
    id: raw.id,
    url: raw.guid.rendered,
    alt: raw.description?.rendered ?? '',
    mimeType: raw.mime_type,
    width: raw.media_details.width,
    height: raw.media_details.height,
    sizes: Object.fromEntries(Object.entries(raw.media_details.sizes ?? {}).map(([key, size]) => [
        key,
        {
            url: size.source_url,
            width: size.width,
            height: size.height,
            mimeType: size.mime_type,
            filesize: size.filesize,
        },
    ])),
});
export async function hydrateMedia(client, id) {
    if (!id)
        return null;
    try {
        const media = await client.media(id);
        return media;
    }
    catch (error) {
        console.warn('Failed to hydrate media', id, error);
        return null;
    }
}
//# sourceMappingURL=media.js.map