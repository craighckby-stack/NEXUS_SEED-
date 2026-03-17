/**
 * services/integrity/ASDM_ValidationResultProcessor.js V94.1
 * Utility to transform raw Ajv validation errors into standardized, actionable, and machine-readable output.
 */

/**
 * @typedef {object} AjvError
 * @property {string} keyword - The Ajv keyword (e.g., 'required', 'maxLength').
 * @property {string} instancePath - The JSON pointer path to the failed instance.
 * @property {string} [dataPath] - Deprecated path field (for compatibility).
 * @property {string} [message] - Ajv generated error message.
 * @property {object} params - Keyword specific parameters.
 */

/**
 * @typedef {object} StandardIssue
 * @property {string} schema - The key of the schema validated against.
 * @property {string} field - The canonical path of the invalid data (JSON Pointer format).
 * @property {string} code - The type of validation failure (Ajv keyword).
 * @property {string} message - A descriptive error message (usually the Ajv generated message).
 */

/**
 * Transforms Ajv errors into a standardized, minimal failure list (StandardIssue format).
 * Ensures array input robustness and handles varying Ajv path outputs.
 *
 * @param {string} schemaKey - The key of the schema validated against.
 * @param {Array<AjvError>} rawErrors - The errors array returned by Ajv.
 * @returns {Array<StandardIssue>}
 */
export function processValidationErrors(schemaKey, rawErrors) {
    if (!Array.isArray(rawErrors) || rawErrors.length === 0) {
        return [];
    }

    return rawErrors.map(error => ({
        schema: schemaKey,
        // Prioritize instancePath (modern Ajv) but fall back to dataPath or root '/'
        field: error.instancePath || error.dataPath || '/', 
        code: error.keyword,
        message: error.message || `Validation error [${error.keyword}] details unavailable`
    }));
}

/**
 * Creates a standardized validation response object based on raw Ajv output.
 * @param {string} schemaKey - The key of the schema validated against.
 * @param {{isValid: boolean, errors: Array<AjvError>|null|undefined}} validationResult
 * @returns {{success: boolean, issues: Array<StandardIssue>}}
 */
export function createValidationResponse(schemaKey, validationResult) {
    // Use robust optional chaining and nullish coalescing
    const isValid = validationResult?.isValid ?? false;
    const errors = validationResult?.errors ?? null;

    const issues = isValid 
        ? [] 
        : processValidationErrors(schemaKey, errors);

    return {
        success: isValid,
        issues: issues,
    };
}
