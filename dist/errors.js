export class WordpressError extends Error {
    statusCode;
    code;
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'WordpressError';
    }
}
export class WordpressNotFoundError extends WordpressError {
    constructor(resource, identifier) {
        super(`${resource} not found: ${identifier}`, 404, 'not_found');
        this.name = 'WordpressNotFoundError';
    }
}
export class WordpressAuthError extends WordpressError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'unauthorized');
        this.name = 'WordpressAuthError';
    }
}
export class WordpressValidationError extends WordpressError {
    details;
    constructor(message, details) {
        super(message, 400, 'validation_error');
        this.details = details;
        this.name = 'WordpressValidationError';
    }
}
//# sourceMappingURL=errors.js.map