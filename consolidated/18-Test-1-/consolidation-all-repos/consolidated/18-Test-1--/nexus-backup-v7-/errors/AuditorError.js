/**
 * AuditorError v1.0.0
 * Custom error class for reporting strict validation and constraint violations
 * encountered by the ParameterAuditor or similar security/integrity components.
 */
class AuditorError extends Error {
    constructor(message, code = 'AUDIT_GENERIC') {
        super(`[AuditorError ${code}]: ${message}`);
        this.name = 'AuditorError';
        this.code = code;
    }
}

export { AuditorError };