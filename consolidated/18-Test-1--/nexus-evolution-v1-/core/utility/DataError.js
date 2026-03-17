/**
 * @module DataError
 * @description Centralized custom error classes for data retrieval and handling operations.
 */

class BaseError extends Error {
    constructor(message, code, isFatal = false) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.isFatal = isFatal;
        // Capturing the stack trace for V8/Node
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Error specifically for issues related to handler configuration or instantiation.
 */
export class HandlerInstantiationError extends BaseError {
    constructor(message, code = 'HANDLER_INSTANTIATION_FAILURE') {
        super(message, code, true); // Fatal: Configuration is broken
    }
}

/**
 * Error specifically for issues encountered during the retrieval attempt (I/O, network, strategy failures, or missing primitives).
 */
export class RetrievalError extends BaseError {
    constructor(message, code = 'DATA_RETRIEVAL_FAILURE') {
        super(message, code, false);
    }
}

// Exporting the base class for comprehensive integration into UNIFIER.js
export { BaseError };