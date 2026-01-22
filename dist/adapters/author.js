/**
 * @internal
 * Transforms raw WordPress author responses into clean Author objects.
 */
/** @internal Converts a raw WordPress author to a clean Author object. */
export const toAuthor = (raw) => ({
    id: raw.id,
    name: raw.name,
    url: raw.url,
    description: raw.description,
});
//# sourceMappingURL=author.js.map