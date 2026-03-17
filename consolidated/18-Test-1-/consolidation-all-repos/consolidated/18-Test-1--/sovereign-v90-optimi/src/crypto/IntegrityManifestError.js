/**
 * Represents the context in which an integrity manifest error occurred.
 */
type ErrorContext = 'GENERATION' | 'VALIDATION' | 'LOAD' | 'OPERATION';

/**
 * Custom error class designed to handle structured aggregation of errors,
 * especially those arising from concurrent operations like hashing or validation.
 * 
 * IMPORTANT: This error class is strictly a data carrier and does not contain
 * kernel dependency resolution or complex external formatting logic.
 */
class IntegrityManifestError extends Error {
    public readonly details: string[];
    public readonly context: ErrorContext;

    /**
     * Creates a new IntegrityManifestError instance.
     * @param message - Primary error message
     * @param details - Detailed list of errors (e.g., per-file failures)
     * @param context - Operation context
     */
    constructor(
        message: string,
        details: string[] = [],
        context: ErrorContext = 'OPERATION'
    ) {
        super(message);
        this.name = 'IntegrityManifestError';
        this.details = Object.freeze(details);
        this.context = context;

        // Capture stack trace, excluding the constructor call
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, IntegrityManifestError);
        }
    }

    /**
     * Provides a consolidated report of the error and all detailed failures 
     * using internal, basic formatting. External formatting tools should be 
     * applied by consumers (e.g., LoggerKernel) who have access to strategic tools.
     * @returns Formatted error report
     */
    get fullReport(): string {
        const report = `[INTEGRITY FAILURE: ${this.context}] ${this.message}`;

        if (this.details.length === 0) {
            return report;
        }

        const detailsSection = `\n\nDetailed Failures (${this.details.length} total):${this.details.map(detail => `\n -> ${detail}`).join('')}`;
        return report + detailsSection;
    }

    /**
     * Override standard toString() to provide the full error report.
     * @returns Formatted error report
     */
    toString(): string {
        return this.fullReport;
    }
}

export default IntegrityManifestError;
