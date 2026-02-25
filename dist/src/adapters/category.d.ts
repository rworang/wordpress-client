/**
 * @internal
 * Transforms raw WordPress category responses into clean Category objects.
 * Validates input with Zod.
 */
import type { RawCategory } from '../types/raw';
import type { Category } from '../types/domain';
/** @internal Converts a raw WordPress category to a clean Category object. */
export declare const toCategory: (raw: RawCategory) => Category;
//# sourceMappingURL=category.d.ts.map