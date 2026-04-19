import { extractPagination } from './utils/pagination';
import { WordpressNotFoundError, WordpressSchemaError } from './errors';
function validateItem(schema, raw, label) {
    if (!schema) {
        return raw;
    }
    const result = schema.safeParse(raw);
    if (!result.success) {
        throw new WordpressSchemaError(label, result.error.issues);
    }
    return result.data;
}
// Complements invalidationTargets() in src/client.ts (~line 164): that helper busts the
// resource's own path automatically inside client.request(); this one adds any
// user-supplied `invalidates` prefixes and skips self to avoid double-work.
function applyExtraInvalidations(client, prefixes, resourcePath) {
    if (!prefixes)
        return;
    for (const prefix of prefixes) {
        if (prefix === resourcePath)
            continue;
        client.invalidate(prefix);
    }
}
export function createResource(client, config) {
    const { path, base, itemSchema, invalidates, singleton } = config;
    const label = path;
    if (singleton) {
        const singletonMethods = {
            async get(options) {
                const response = await client.request({
                    method: 'GET',
                    path,
                    base,
                    signal: options?.signal,
                });
                return validateItem(itemSchema, response.data, label);
            },
            async update(payload, options) {
                const response = await client.request({
                    method: 'POST',
                    path,
                    body: payload,
                    base,
                    requireAuth: true,
                    signal: options?.signal,
                });
                applyExtraInvalidations(client, invalidates, path);
                return validateItem(itemSchema, response.data, label);
            },
        };
        return singletonMethods;
    }
    const methods = {
        async list(params, options) {
            const response = await client.request({
                method: 'GET',
                path,
                params,
                base,
                signal: options?.signal,
            });
            const page = typeof params?.page === 'number' ? params.page : 1;
            const perPage = typeof params?.per_page === 'number' ? params.per_page : response.data.length;
            const paginated = extractPagination(response, page, perPage);
            const items = paginated.data.map((raw) => validateItem(itemSchema, raw, label));
            return { ...paginated, data: items };
        },
        async get(idOrSlug, options) {
            if (typeof idOrSlug === 'number') {
                const response = await client.request({
                    method: 'GET',
                    path: `${path}/${idOrSlug}`,
                    base,
                    signal: options?.signal,
                });
                return validateItem(itemSchema, response.data, label);
            }
            const response = await client.request({
                method: 'GET',
                path,
                params: { slug: idOrSlug },
                base,
                signal: options?.signal,
            });
            if (!response.data.length) {
                throw new WordpressNotFoundError(label, idOrSlug);
            }
            return validateItem(itemSchema, response.data[0], label);
        },
        async create(payload, options) {
            const response = await client.request({
                method: 'POST',
                path,
                body: payload,
                base,
                requireAuth: true,
                signal: options?.signal,
            });
            applyExtraInvalidations(client, invalidates, path);
            return validateItem(itemSchema, response.data, label);
        },
        async update(id, payload, options) {
            const response = await client.request({
                method: 'POST',
                path: `${path}/${id}`,
                body: payload,
                base,
                requireAuth: true,
                signal: options?.signal,
            });
            applyExtraInvalidations(client, invalidates, path);
            return validateItem(itemSchema, response.data, label);
        },
        async delete(id, options) {
            const force = options?.force ?? true;
            const response = await client.request({
                method: 'DELETE',
                path: `${path}/${id}`,
                params: { force: force ? 'true' : 'false' },
                base,
                requireAuth: true,
                signal: options?.signal,
            });
            applyExtraInvalidations(client, invalidates, path);
            if (force) {
                const body = response.data;
                if (!body.previous) {
                    throw new WordpressSchemaError(label, [
                        { path: ['previous'], message: 'Delete response did not include the previous item' },
                    ]);
                }
                return { deleted: true, previous: validateItem(itemSchema, body.previous, label) };
            }
            return { deleted: false, trashed: validateItem(itemSchema, response.data, label) };
        },
    };
    return methods;
}
//# sourceMappingURL=resources.js.map