/**
 * Standardized function to transform validation library errors (e.g., Ajv errors) 
 * into the system's internal structured error format.
 * 
 * @param {Array<object>} rawErrors - Array of errors returned by the validation library.
 * @returns {Array<{path: string, message: string, keyword: string, params: object, schemaPath: string}>}
 */
function formatValidationError(rawErrors = []) {
    if (!Array.isArray(rawErrors)) {
        // Fail silently or log a warning if non-array input is unexpected
        return [];
    }
    // Maps common validation error structures (like Ajv) to internal standard
    return rawErrors.map(err => ({
        path: err.instancePath || '', 
        message: err.message || 'Validation error',
        keyword: err.keyword || 'unknown',
        params: err.params || {},
        schemaPath: err.schemaPath || '',
    }));
}

module.exports = { formatValidationError };
