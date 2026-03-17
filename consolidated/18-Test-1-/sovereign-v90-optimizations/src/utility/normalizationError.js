/**
 * Component ID: NE
 * Name: Normalization Error
 * GSEP Alignment: Stage 5 / Maintenance / Error Handling
 * 
 * Purpose: Custom error class for reporting structured schema violations, data coercion failures,
 * or integrity violations encountered during log normalization (LNM). This allows downstream 
 * analytic engines (GMRE/SEA) to programmatically categorize, filter, and quarantine malformed entries 
 * using standardized LNM error codes.
 * 
 * NOTE: Instantiation of this error type across the system should ideally utilize the 
 * NormalizationErrorFactory tool for canonical structure enforcement.
 */
class NormalizationError extends Error {
    public logEntry: Object;
    public field: string;
    public code: string;

    /**
     * @param {string} message - Descriptive error message.
     * @param {Object} logEntry - The raw log entry that failed.
     * @param {string} [field] - The specific field that triggered the error. Defaults to 'General'.
     * @param {string} [code] - Standardized error code (e.g., LNM_100, LNM_401). Defaults to 'LNM_400'.
     */
    constructor(message: string, logEntry: Object, field?: string, code?: string) {
        const finalField = field || 'General';
        const finalCode = code || 'LNM_400';
        
        super(`[${finalCode}] ${message} (Field: ${finalField})`);
        
        this.name = 'NormalizationError';
        this.logEntry = logEntry;
        this.field = finalField;
        this.code = finalCode;
        
        // Standard practice for extending Error
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NormalizationError);
        }
    }
}

module.exports = NormalizationError;