import axios from 'axios';
import { toPost } from './adapters/post';
import { toMedia } from './adapters/media';
import { toCategory } from './adapters/category';
import { extractPagination } from './utils/pagination';
import { WordpressError, WordpressNotFoundError, WordpressAuthError } from './errors';
export class WordpressClient {
    http;
    constructor({ baseURL, namespace = 'wp/v2', timeout = 10_000, }) {
        if (!baseURL) {
            throw new Error('WordpressClient: baseURL is required');
        }
        this.http = axios.create({
            baseURL: `${baseURL.replace(/\/$/, '')}/wp-json/${namespace}`,
            timeout,
        });
        this.http.interceptors.response.use((response) => response, (error) => this.handleError(error));
    }
    // ---- Posts ----
    async posts(params = {}) {
        const { page = 1, per_page = 10, ...rest } = params;
        const response = await this.http.get('/posts', {
            params: { _embed: true, page, per_page, ...rest },
        });
        const paginated = extractPagination(response, page, per_page);
        const posts = await Promise.all(paginated.data.map((raw) => toPost(raw, this)));
        return { ...paginated, data: posts };
    }
    async post(slug) {
        const response = await this.http.get('/posts', {
            params: { slug, _embed: true },
        });
        return response.data.length ? await toPost(response.data[0], this) : null;
    }
    async postById(id) {
        const response = await this.http.get(`/posts/${id}`, {
            params: { _embed: true },
        });
        return toPost(response.data, this);
    }
    // ---- Categories ----
    async categories(params = {}) {
        const { page = 1, per_page = 100, ...rest } = params;
        const response = await this.http.get('/categories', {
            params: { page, per_page, ...rest },
        });
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toCategory) };
    }
    async category(slug) {
        const response = await this.http.get('/categories', {
            params: { slug },
        });
        return response.data.length ? toCategory(response.data[0]) : null;
    }
    // ---- Media ----
    async media(id) {
        const response = await this.http.get(`/media/${id}`);
        return toMedia(response.data);
    }
    async mediaList(params = {}) {
        const { page = 1, per_page = 10, ...rest } = params;
        const response = await this.http.get('/media', {
            params: { page, per_page, ...rest },
        });
        const paginated = extractPagination(response, page, per_page);
        return { ...paginated, data: paginated.data.map(toMedia) };
    }
    // ---- Error Handling ----
    handleError(error) {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            if (status === 404) {
                throw new WordpressNotFoundError('Resource', 'unknown');
            }
            if (status === 401 || status === 403) {
                throw new WordpressAuthError(data?.message);
            }
            throw new WordpressError(data?.message || error.message, status, data?.code);
        }
        throw new WordpressError(error.message);
    }
}
//# sourceMappingURL=client.js.map