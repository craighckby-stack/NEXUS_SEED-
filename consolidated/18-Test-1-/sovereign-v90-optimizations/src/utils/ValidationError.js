/**
 * Interface defining the standardized validation error structure.
 */
export interface IValidationError {
    field: string;
    message: string;
    code: string;
    severity: 'error' | 'warning' | 'info';
    toString(): string;
}

/**
 * Standardized class for representing a single validation error.
 * Ensures consistency across different validation engines (CrossField, TypeCheck, Schema, etc.).
 * Implements the IValidationError interface for type consistency.
 */
class ValidationError implements IValidationError {
    public readonly field: string;
    public readonly message: string;
    public readonly code: string;
    public readonly severity: 'error' | 'warning' | 'info';

    /**
     * @param field - The dot-separated path of the field causing the error (e.g., 'user.email').
     * @param message - Human-readable error message.
     * @param code - Machine-readable error code (e.g., 'dependency.required', 'type.invalid').
     * @param severity - Optional severity level ('error', 'warning', 'info'). Defaults to 'error'.
     */
    constructor(
        field: string,
        message: string,
        code: string,
        severity: 'error' | 'warning' | 'info' = 'error'
    ) {
        if (!field || !message || !code) {
             // Enforce mandatory fields for a canonical error object
             throw new Error("ValidationError must have field, message, and code defined.");
        }
        this.field = field;
        this.message = message;
        this.code = code;
        this.severity = severity;
    }

    /**
     * Returns a standardized string representation of the error.
     */
    toString(): string {
        return `[${this.severity.toUpperCase()}] ${this.code} on ${this.field}: ${this.message}`;
    }
}

export { ValidationError };
