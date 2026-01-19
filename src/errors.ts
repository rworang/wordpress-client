export class WordpressError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'WordpressError'
  }
}

export class WordpressNotFoundError extends WordpressError {
  constructor(resource: string, identifier: string | number) {
    super(`${resource} not found: ${identifier}`, 404, 'not_found')
    this.name = 'WordpressNotFoundError'
  }
}

export class WordpressAuthError extends WordpressError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'unauthorized')
    this.name = 'WordpressAuthError'
  }
}

export class WordpressValidationError extends WordpressError {
  constructor(
    message: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message, 400, 'validation_error')
    this.name = 'WordpressValidationError'
  }
}
