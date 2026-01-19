/**
 * @internal
 * Transforms raw WordPress category responses into clean Category objects.
 */
/** @internal Converts a raw WordPress category to a clean Category object. */
export const toCategory = (raw) => ({
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    description: raw.description,
    count: raw.count,
});
//# sourceMappingURL=category.js.map