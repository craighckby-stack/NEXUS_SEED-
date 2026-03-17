/**
 * @fileoverview AuditorError v2.1.1
 * Custom error class for signaling strict validation and constraint violations
 * encountered by security or integrity components (e.g., ParameterAuditor).
 * It provides structured context, standard serialization, and factory methods,
 * built on the reusable StructuredErrorBase.
 */

import { StructuredErrorBase } from './StructuredErrorBase';

class AuditorError extends StructuredErrorBase {
    /** The standard name for this error type. */
    name: 'AuditorError' = 'AuditorError';

    /** A version identifier for serialization tracking. */
    static VERSION = 'v2.1.1';

    /**
     * Utility to resolve effective options by applying AuditorError specific defaults.
     * Extracted synchronous setup logic.
     * @param {object} options 
     * @returns {object}
     */
    static #resolveEffectiveOptions(options: { code?: string, details?: object, cause?: Error | any } = {}) {
        return {
            code: 'AUDIT_GENERIC',
            details: {},
            ...options
        };
    }

    /**
     * I/O Proxy: Delegates the actual instantiation of an AuditorError instance.
     * This encapsulates the core action of error object creation.
     * @param {string} message 
     * @param {object} options 
     * @returns {AuditorError}
     */
    static #delegateToAuditorErrorCreation(message: string, options: object): AuditorError {
        return new AuditorError(message, options);
    }

    /**
     * @param {string} message - A concise, descriptive error message.
     * @param {object} [options={}] - Configuration options for the error.
     * @param {string} [options.code='AUDIT_GENERIC'] - A machine-readable error code.
     * @param {object} [options.details={}] - Structured context.
     * @param {Error} [options.cause] - The underlying error.
     */
    constructor(message: string, options: { code?: string, details?: object, cause?: Error | any } = {}) {
        // Synchronous Setup Extraction: Resolve defaults before calling super.
        const effectiveOptions = AuditorError.#resolveEffectiveOptions(options);
        
        // All stack capturing, code/details assignment, and cause handling are done by StructuredErrorBase.
        super(message, effectiveOptions);
    }

    /**
     * Factory method for creating an AuditorError due to a required field being missing or empty.
     * @param {string} fieldName - The name of the missing field.
     * @param {object} [context={}] - Additional details.
     * @returns {AuditorError}
     */
    static requiredField(fieldName: string, context: object = {}): AuditorError {
        const message = `Required field missing or invalid: ${fieldName}`;
        const options = {
            code: 'AUDIT_REQUIRED_FIELD',
            details: { fieldName, ...context }
        };
        // Delegate instantiation via I/O Proxy
        return AuditorError.#delegateToAuditorErrorCreation(message, options);
    }

    /**
     * Factory method for creating an AuditorError due to a value failing specific constraints.
     * @param {string} message - The failure description.
     * @param {object} constraints - The constraints that failed (e.g., { minLength: 5 }).
     * @returns {AuditorError}
     */
    static constraintViolation(message: string, constraints: object): AuditorError {
        const options = {
            code: 'AUDIT_CONSTRAINT_VIOLATION',
            details: { constraints }
        };
        // Delegate instantiation via I/O Proxy
        return AuditorError.#delegateToAuditorErrorCreation(message, options);
    }

    // toJSON method is inherited from StructuredErrorBase
}

export { AuditorError };
