const { ConsensusErrorCodes } = require('./ConsensusErrorCodes');

/**
 * ConsensusError
 * Specialized Error Class for the Sovereign AGI Consensus Stack.
 * Provides standardized, traceable, and categorizable error reporting.
 */
class ConsensusError extends Error {
    /**
     * @param {string} code - Machine-readable, unique error code (Must be from ConsensusErrorCodes).
     * @param {string} [message] - Human-readable description of the error (optional).
     * @param {object} [details={}] - Additional structured data for debugging/traceability.
     */
    constructor(code, message, details = {}) {
        // 1. Guardrail: Enforce known codes and default to E_UNKNOWN if necessary.
        if (!Object.values(ConsensusErrorCodes).includes(code)) {
            code = ConsensusErrorCodes.E_UNKNOWN;
        }

        const finalMessage = message || `Consensus operation failed with code: ${code}.`;

        super(finalMessage);

        this.name = 'ConsensusError';
        this.code = code;
        this.details = Object.freeze(details); // Make details immutable for safety

        // 2. Optimization: Capturing stack trace for V8/Node environments.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConsensusError);
        }
    }

    /**
     * Creates a structured error object for logs, serialization, and API responses.
     */
    toJSON() {
        return {
            error: true,
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            // Enhancement: Include stack trace for high-fidelity debugging
            ...(this.stack && { stack: this.stack.split('\n').map(line => line.trim()) }),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Factory method for cleaner instantiation syntax.
     * @param {string} code 
     * @param {object} [details={}] - Structured data.
     * @param {string} [message] - Optional human message.
     */
    static create(code, details = {}, message) {
        return new ConsensusError(code, message, details);
    }
}

module.exports = { ConsensusError };
