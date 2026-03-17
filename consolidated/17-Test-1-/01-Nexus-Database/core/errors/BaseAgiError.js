/**
 * Sovereign AGI v94.1 - Core Utility: Base Error Class
 * Provides a foundational structure for all custom application errors in the AGI system,
 * ensuring consistency in logging, monitoring, and serialization.
 */
export class BaseAgiError extends Error {
    /**
     * @param {string} message - The core human-readable error description.
     * @param {string} [name='AgiError'] - The specific error name.
     * @param {number} [httpStatus=500] - The appropriate HTTP status code for this error type.
     */
    constructor(message, name = 'AgiError', httpStatus = 500) {
        super(message);
        this.name = name;
        
        /** @type {string} */
        this.timestamp = new Date().toISOString();
        
        /** @type {number} */
        this.httpStatus = httpStatus;

        // V8 optimization for cleaner stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Provides a clean serializable representation of the error, ideal for API responses or logging.
     * @returns {Object} Serialized error object.
     */
    toJson() {
        return {
            name: this.name,
            message: this.message,
            timestamp: this.timestamp,
            httpStatus: this.httpStatus
        };
    }
}