/**
 * @internal
 * Transforms raw WordPress tag responses into clean Tag objects.
 * Validates input with Zod.
 */
import type { RawTag } from '../types/raw';
import type { Tag } from '../types/domain';
/** @internal Converts a raw WordPress tag to a clean Tag object. */
export declare const toTag: (raw: RawTag) => Tag;
//# sourceMappingURL=tag.d.ts.map