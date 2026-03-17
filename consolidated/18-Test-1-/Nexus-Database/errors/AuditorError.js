/**
 * @fileoverview AuditorError v2.1.0
 * Custom error class for signaling strict validation and constraint violations
 * encountered by security or integrity components (e.g., ParameterAuditor).
 * It provides structured context, standard serialization, and factory methods.
 */
class AuditorError extends Error {
    /** The standard name for this error type. */
    name = 'AuditorError';

    /** A version identifier for serialization tracking. */
    static VERSION = 'v2.1.0';

    /**
     * @param {string} message - A concise, descriptive error message.
     * @param {object} [options={}] - Configuration options for the error.
     * @param {string} [options.code='AUDIT_GENERIC'] - A machine-readable error code (e.g., 'AUDIT_REQUIRED_FIELD').
     * @param {object} [options.details={}] - Structured context, e.g., { parameterName, failedValue, constraints }.
     * @param {Error} [options.cause] - The underlying error that caused this AuditorError (for error wrapping).
     */
    constructor(message, options = {}) {
        // Error cause handling is standard practice in modern JS/TS error systems
        super(message, { cause: options.cause });

        const { code = 'AUDIT_GENERIC', details = {} } = options;

        this.code = code;
        this.details = details;

        // Node.js/V8 specific optimization: captureStackTrace makes error instantiation cleaner in stack traces.
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, AuditorError);
        }
    }

    /**
     * Factory method for creating an AuditorError due to a required field being missing or empty.
     * @param {string} fieldName - The name of the missing field.
     * @param {object} [context={}] - Additional details.
     * @returns {AuditorError}
     */
    static requiredField(fieldName, context = {}) {
        return new AuditorError(
            `Required field missing or invalid: ${fieldName}`,
            {
                code: 'AUDIT_REQUIRED_FIELD',
                details: { fieldName, ...context }
            }
        );
    }

    /**
     * Factory method for creating an AuditorError due to a value failing specific constraints.
     * @param {string} message - The failure description.
     * @param {object} constraints - The constraints that failed (e.g., { minLength: 5 }).
     * @returns {AuditorError}
     */
    static constraintViolation(message, constraints) {
        return new AuditorError(message, {
            code: 'AUDIT_CONSTRAINT_VIOLATION',
            details: { constraints }
        });
    }

    /**
     * Returns a structured representation of the error, useful for standardized logging and API responses.
     */
    toJSON() {
        const output = {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            stack: this.stack
        };
        
        // Serialize the cause if present and serializable
        if (this.cause) {
            output.cause = this.cause instanceof Error && typeof this.cause.toJSON === 'function'
                ? this.cause.toJSON()
                : String(this.cause);
        }

        return output;
    }
}

export { AuditorError };
