/**
 * IntegrityManifestError
 * Custom error class designed to handle structured aggregation of errors,
 * especially those arising from concurrent operations like hashing or validation.
 */
class IntegrityManifestError extends Error {
    /**
     * @param {string} message Primary error message.
     * @param {string[]=} details Detailed list of errors (e.g., per-file failures).
     * @param {('GENERATION'|'VALIDATION'|'LOAD')} context Operation context.
     */
    constructor(message, details = [], context = 'OPERATION') {
        super(message);
        this.name = 'IntegrityManifestError';
        this.details = details;
        this.context = context;

        // Capture stack trace, excluding the constructor call
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, IntegrityManifestError);
        }
    }

    /**
     * Provides a consolidated report of the error and all detailed failures.
     * @returns {string}
     */
    get fullReport() {
        let report = `[${this.context} FAILURE] ${this.message}`; 
        if (this.details.length > 0) {
            report += '\nDetailed Failures:\n - ' + this.details.join('\n - ');
        }
        return report;
    }
}

module.exports = IntegrityManifestError;
