/**
 * Base class for all SDK-specific errors.
 */
export class AuraXError extends Error {
  public readonly status?: number;
  public readonly error?: any; // The parsed JSON error from the API response body

  constructor(message: string, options?: { status?: number; error?: any }) {
    super(message);
    this.name = this.constructor.name;
    this.status = options?.status;
    this.error = options?.error;
  }
}

/**
 * Thrown for network-level errors, like connection failures.
 */
export class NetworkError extends AuraXError {
  constructor(cause: unknown) {
    super("A network error occurred. Please check your connection.", {
      error: cause,
    });
  }
}

/**
 * Thrown for 400 Bad Request errors.
 * Indicates invalid input, like missing files or incorrect parameters.
 */
export class BadRequestError extends AuraXError {}

/**
 * Thrown for 401 Unauthorized errors.
 * Indicates a missing or invalid API key.
 */
export class AuthenticationError extends AuraXError {}

/**
 * Thrown for 404 Not Found errors.
 * Indicates that the requested resource (like a task or API key ID) does not exist.
 */
export class NotFoundError extends AuraXError {}

/**
 * Thrown for polling timeouts in the `pollTask` helper.
 */
export class TimeoutError extends AuraXError {}

/**
 * A catch-all for other non-2xx API responses (e.g., 500 Internal Server Error).
 */
export class APIError extends AuraXError {}
