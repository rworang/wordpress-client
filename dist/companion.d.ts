import type { WordpressClient } from './client';
/** Payload returned by `GET /worang-client/v1/version` when the companion plugin is installed. */
export interface CompanionVersion {
    version: string;
    features: string[];
}
/**
 * Optional companion-plugin namespace exposed as `client.companion.*`.
 *
 * All methods return `null` when the companion plugin is absent (404 on the
 * target endpoint). Any other error (network failure, 5xx) is rethrown so
 * callers can distinguish "not installed" from "installation broken".
 */
export interface CompanionNamespace {
    version(): Promise<CompanionVersion | null>;
    cacheVersion(): Promise<string | null>;
}
export declare function createCompanion(client: WordpressClient): CompanionNamespace;
//# sourceMappingURL=companion.d.ts.map