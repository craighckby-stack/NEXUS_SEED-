/**
 * Custom Error Class: SecurePolicyLedgerError
 * Used to wrap errors specifically originating from interaction with the D-01 Ledger.
 * This allows downstream components (like CIM or Governance) to specifically catch 
 * and handle integrity or persistence failures distinct from network or general system errors.
 */
class SecurePolicyLedgerError extends Error {
    /**
     * @param {string} message - The error message.
     * @param {string} code - A specific, machine-readable error code (e.g., 'D01_INTEGRITY_FAIL', 'D01_STORAGE_REFUSED').
     * @param {object} [details={}] - Optional additional context or data related to the failure.
     */
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'SecurePolicyLedgerError';
        this.code = code;
        this.details = details;

        // Maintain proper stack trace for V8
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SecurePolicyLedgerError);
        }
    }
}

module.exports = SecurePolicyLedgerError;