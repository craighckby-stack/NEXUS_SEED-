/**
 * @fileoverview Standard utility to format Errors into a consistent, safe, and consumable JSON structure
 * for API responses and structured logging.
 */

class ErrorFormatter {
    /**
     * Converts an Error object into a serializable plain object.
     * Handles both operational (client-facing) and critical (internal) errors.
     * @param {Error} err - The error object to format.
     * @param {boolean} [includeStack=false] - Whether to include the stack trace (default for logging, false for API response).
     * @returns {Object} Standardized error structure.
     */
    static format(err, includeStack = false) {
        // 1. Handle errors with defined operational serialization (e.g., PayloadSchemaError)
        if (err.isOperational && typeof err.toJSON === 'function') {
            const formatted = err.toJSON();
            if (includeStack) {
                formatted.stack = err.stack;
            }
            return formatted;
        }

        // 2. Handle generic/critical non-operational errors (System crash, unhandled exceptions)
        const status = err.status || 500;
        const code = err.code || 'SYS_INTERNAL_ERROR';
        
        // Mask sensitive internal messages for 5xx errors
        const message = status >= 500
            ? "An internal server error occurred."
            : err.message || "An unknown error occurred.";

        const genericFormat = {
            name: err.name || 'InternalError',
            code: code,
            status: status,
            message: message
        };

        if (includeStack) {
            genericFormat.stack = err.stack;
        }

        // Preserve validation details if they exist on a non-standard error
        if (err.validationDetails) {
            genericFormat.validationDetails = err.validationDetails;
        }

        return genericFormat;
    }
}

module.exports = ErrorFormatter;
