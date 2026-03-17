/**
 * Custom error class for failures related to cryptographic proof verification
 * or consensus axiomatic breaches, ensuring dedicated centralized error handling.
 */
export class ProofVerificationError extends Error {
    /**
     * @param {string} message - Human-readable error message.
     * @param {object} [context={}] - Optional context data for debugging (e.g., proof ID, validator ID).
     */
    constructor(message, context = {}) {
        super(message);
        this.name = 'ProofVerificationError';
        this.context = context;
        // Ensure compatibility with V8 stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ProofVerificationError);
        }
    }
}