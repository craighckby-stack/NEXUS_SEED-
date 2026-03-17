/**
 * ATTENTION FAILURE RECORD (AFR)
 * ID: AFR-E01
 * GSEP Role: Standardized error structure for pre-execution integrity checks.
 *
 * This record ensures that governance failures are reported consistently, including
 * necessary metadata for telemetry and auditing (e.g., error codes, full reports).
 */
class AttestationFailureRecord extends Error {
    /**
     * @type {string}
     */
    code;

    /**
     * @type {object}
     */
    details;

    /**
     * @type {string}
     */
    timestamp;

    /**
     * @param {string} code - Standardized error code (See AttestationErrorCodes).
     * @param {string} message - Human-readable explanation of the error.
     * @param {object} [details={}] - Optional data payload, often containing the full AttestationReport or system state.
     */
    constructor(code, message, details = {}) {
        // Ensure the message starts with the code for quick log identification
        super(`[${code}]: ${message}`);

        this.code = code;
        this.details = details;
        this.name = 'AttestationFailureRecord';
        this.timestamp = new Date().toISOString(); // Capture failure time immediately

        // Capture the stack trace specific to this error instantiation.
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AttestationFailureRecord);
        }
    }

    /**
     * Returns the failure record data as a serializable object for standard JSON logging.
     * This method is automatically called by JSON.stringify().
     */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            timestamp: this.timestamp,
            details: this.details,
            stack: this.stack
        };
    }
}

module.exports = AttestationFailureRecord;
