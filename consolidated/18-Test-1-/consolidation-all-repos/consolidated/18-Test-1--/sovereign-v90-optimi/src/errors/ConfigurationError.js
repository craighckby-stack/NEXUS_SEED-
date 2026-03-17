import { OperationalErrorBase } from '../lib/OperationalErrorBase';

/**
 * Custom error class for reporting configuration, environment variable,
 * or initialization failures.
 *
 * It is categorized as an 'Operational Error' meaning it relates to
 * issues outside the program's immediate logic (e.g., environment setup,
 * connectivity, validation failure), and should be handled gracefully.
 */
export class ConfigurationError extends OperationalErrorBase {
    // Properties (isOperational, code, context) are inherited from OperationalErrorBase

    /**
     * @param {string} message - Human-readable description of the error.
     * @param {string} [code] - Machine-readable error code (e.g., 'MISSING_ENV', 'INVALID_SCHEMA').
     * @param {Object} [context={}] - Additional details relevant for debugging.
     */
    constructor(message, code, context = {}) {
        // 1. Determine the specific default code for this class
        const finalCode = code || 'E_CONFIG_GENERIC';

        // 2. Call the base class constructor for full initialization, operational flag setting, and stack trace fixing.
        super(
            message, 
            finalCode, 
            context,
            ConfigurationError // Pass the constructor reference for stack trace clean up
        );
    }

    // toString() is inherited from OperationalErrorBase
}