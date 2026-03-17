/**
 * Component ID: NE
 * Name: Normalization Error
 * GSEP Alignment: Stage 5 / Maintenance / Error Handling
 * 
 * Purpose: Custom error class for reporting structured schema violations, data coercion failures,
 * or integrity violations encountered during log normalization (LNM). This allows downstream 
 * analytic engines (GMRE/SEA) to programmatically categorize, filter, and quarantine malformed entries 
 * using standardized LNM error codes.
 */
class NormalizationError extends Error {
    /**
     * @param {string} message - Descriptive error message.
     * @param {Object} logEntry - The raw log entry that failed.
     * @param {string} field - The specific field that triggered the error.
     * @param {string} code - Standardized error code (e.g., LNM_100, LNM_401).
     */
    constructor(message, logEntry, field = 'General', code = 'LNM_400') {
        super(`[${code}] ${message} (Field: ${field})`);
        this.name = 'NormalizationError';
        this.logEntry = logEntry;
        this.field = field;
        this.code = code;
    }
}

module.exports = NormalizationError;