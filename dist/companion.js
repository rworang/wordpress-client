import { WordpressNotFoundError } from './errors';
export function createCompanion(client) {
    return {
        async version() {
            return fetchOrNull(client, '/worang-client/v1/version');
        },
        async cacheVersion() {
            const result = await fetchOrNull(client, '/worang-client/v1/cache-version');
            return result ? String(result.version) : null;
        },
    };
}
async function fetchOrNull(client, path) {
    try {
        const response = await client.request({
            method: 'GET',
            path,
            base: 'site',
        });
        return response.data;
    }
    catch (error) {
        if (error instanceof WordpressNotFoundError) {
            return null;
        }
        throw error;
    }
}
//# sourceMappingURL=companion.js.map