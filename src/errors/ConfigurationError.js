/**
 * Custom error class for reporting configuration, environment variable,
 * or initialization failures.
 *
 * It is categorized as an 'Operational Error' meaning it relates to
 * issues outside the program's immediate logic (e.g., environment setup,
 * connectivity, validation failure), and should be handled gracefully.
 */
export class ConfigurationError extends Error {
    /**
     * @param {string} message - Human-readable description of the error.
     * @param {string} [code] - Machine-readable error code (e.g., 'MISSING_ENV', 'INVALID_SCHEMA').
     * @param {Object} [context={}] - Additional details relevant for debugging.
     */
    constructor(message, code, context = {}) {
        super(message);
        this.name = 'ConfigurationError';
        
        // 1. Standardized Operational Flag
        this.isOperational = true; 

        // 2. Machine Code identification
        this.code = code || 'E_CONFIG_GENERIC'; 
        
        // 3. Structured Context (always include timestamp)
        this.context = {
            timestamp: new Date().toISOString(),
            ...context,
        };
        
        // 4. Proper Stack Trace Management
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConfigurationError);
        }
    }

    /**
     * Provides a standardized string representation including the machine code and category.
     * @returns {string}
     */
    toString() {
        return `[${this.name}:${this.code}] ${this.message}`;
    }
}