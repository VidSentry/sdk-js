/**
 * VidSentry SDK Errors
 */

/** Base error class for VidSentry SDK */
export class VidSentryError extends Error {
    public readonly code: string;
    public readonly details?: Record<string, unknown>;

    constructor(message: string, code: string, details?: Record<string, unknown>) {
        super(message);
        this.name = 'VidSentryError';
        this.code = code;
        this.details = details;
    }
}

/** Authentication failed (invalid/expired API key) */
export class AuthenticationError extends VidSentryError {
    constructor(message = 'Invalid or expired API key') {
        super(message, 'AUTHENTICATION_ERROR');
        this.name = 'AuthenticationError';
    }
}

/** Rate limit exceeded */
export class RateLimitError extends VidSentryError {
    public readonly retryAfter?: number;

    constructor(message = 'Rate limit exceeded', retryAfter?: number) {
        super(message, 'RATE_LIMIT_ERROR', { retryAfter });
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

/** Insufficient wallet balance */
export class InsufficientFundsError extends VidSentryError {
    public readonly required: number;
    public readonly available: number;

    constructor(required: number, available: number) {
        super(
            `Insufficient funds. Required: R${required.toFixed(2)}, Available: R${available.toFixed(2)}`,
            'INSUFFICIENT_FUNDS',
            { required, available }
        );
        this.name = 'InsufficientFundsError';
        this.required = required;
        this.available = available;
    }
}

/** Resource not found */
export class NotFoundError extends VidSentryError {
    constructor(resource: string, id: string) {
        super(`${resource} not found: ${id}`, 'NOT_FOUND', { resource, id });
        this.name = 'NotFoundError';
    }
}

/** Request timeout */
export class TimeoutError extends VidSentryError {
    constructor(message = 'Request timed out') {
        super(message, 'TIMEOUT_ERROR');
        this.name = 'TimeoutError';
    }
}

/** Network/connection error */
export class NetworkError extends VidSentryError {
    constructor(message = 'Network error') {
        super(message, 'NETWORK_ERROR');
        this.name = 'NetworkError';
    }
}
