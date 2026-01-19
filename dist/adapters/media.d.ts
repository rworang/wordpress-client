import type { WordpressClient } from '../client';
import type { RawMedia } from '../types/raw';
import type { Media } from '../types/domain';
export declare const toMedia: (raw: RawMedia) => Media;
export declare function hydrateMedia(client: WordpressClient, id?: number): Promise<Media | null>;
//# sourceMappingURL=media.d.ts.map