/**
 * @internal
 * Transforms raw WordPress page responses into clean Page objects.
 *
 * Pages are structurally similar to posts but include parent hierarchy
 * and menu ordering instead of categories and sticky status.
 */
import type { RawPage } from '../types/raw';
import type { Page } from '../types/domain';
/** @internal Converts a raw WordPress page to a clean Page object. */
export declare const toPage: (raw: RawPage) => Page;
//# sourceMappingURL=page.d.ts.map