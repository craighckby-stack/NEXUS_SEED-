/**
 * @module DataError
 * @description Centralized custom error classes for data retrieval and handling operations.
 */

// Placeholder reference to the internal utility interface for initialization.
// In a real environment, this service would be injected or imported.
declare const ErrorInitializerUtility: {
    initializeCanonicalError(
        errorInstance: Error,
        code: string,
        isFatal: boolean,
        constructorRef: Function
    ): void;
};

/**
 * Base error class ensuring canonical structure (code, isFatal) and proper stack trace capture.
 */
class BaseError extends Error {
    public readonly code: string;
    public readonly isFatal: boolean;

    constructor(
        message: string,
        code: string,
        isFatal: boolean = false
    ) {
        super(message);
        
        this.#delegateToErrorInitializer(code, isFatal);
    }

    /**
     * Delegates canonical property setting and stack capture to the utility.
     */
    #delegateToErrorInitializer(code: string, isFatal: boolean): void {
        ErrorInitializerUtility.initializeCanonicalError(this, code, isFatal, this.constructor);
    }
}

/**
 * Error for issues related to handler configuration or instantiation.
 */
export class HandlerInstantiationError extends BaseError {
    /**
     * Creates an error indicating handler instantiation failure.
     * @param message - The error message describing the instantiation issue.
     */
    constructor(message: string) {
        super(message, 'HANDLER_INSTANTIATION_FAILURE', true);
    }
}

/**
 * Error for issues encountered during data retrieval attempts.
 * This includes I/O errors, network failures, strategy errors, or missing required data.
 */
export class RetrievalError extends BaseError {
    /**
     * Creates an error indicating data retrieval failure.
     * @param message - The error message describing the retrieval issue.
     */
    constructor(message: string) {
        super(message, 'DATA_RETRIEVAL_FAILURE', false);
    }
}
