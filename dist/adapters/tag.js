/**
 * @internal
 * Transforms raw WordPress tag responses into clean Tag objects.
 * Validates input with Zod.
 */
import { RawTagSchema } from '../schemas/tag';
import { WordpressSchemaError } from '../errors';
/** @internal Converts a raw WordPress tag to a clean Tag object. */
export const toTag = (raw) => {
    const result = RawTagSchema.safeParse(raw);
    if (!result.success) {
        throw new WordpressSchemaError('tag', result.error.issues);
    }
    return {
        id: raw.id,
        slug: raw.slug,
        name: raw.name,
        description: raw.description,
        count: raw.count,
    };
};
//# sourceMappingURL=tag.js.map