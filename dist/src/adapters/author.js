/**
 * @internal
 * Transforms raw WordPress author responses into clean Author objects.
 * Validates input with Zod.
 */
import { RawAuthorSchema } from '../schemas/author';
import { WordpressSchemaError } from '../errors';
/** @internal Converts a raw WordPress author to a clean Author object. */
export const toAuthor = (raw) => {
    const result = RawAuthorSchema.safeParse(raw);
    if (!result.success) {
        throw new WordpressSchemaError('author', result.error.issues);
    }
    return {
        id: raw.id,
        name: raw.name,
        url: raw.url,
        description: raw.description,
    };
};
//# sourceMappingURL=author.js.map