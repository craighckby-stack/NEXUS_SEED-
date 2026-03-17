/**
 * ASDM_ValidationResultProcessor V1.0
 * Utility to transform raw Ajv validation errors into standardized, actionable, and machine-readable output.
 */

export const ASDM_ValidationResultProcessor = {
    /**
     * Transforms Ajv errors into a standardized, minimal failure list.
     * @param {string} schemaKey - The key of the schema validated against.
     * @param {Array<object>} rawErrors - The errors array returned by Ajv.
     * @returns {Array<{field: string, code: string, message: string}>}
     */
    processErrors(schemaKey, rawErrors) {
        if (!rawErrors || rawErrors.length === 0) {
            return [];
        }

        return rawErrors.map(error => ({
            schema: schemaKey,
            field: error.instancePath || error.dataPath || '/',
            code: error.keyword,
            message: error.message || 'Validation error details unavailable'
        }));
    },

    /**
     * Creates a standardized validation response object.
     * @param {string} schemaKey - The key of the schema validated against.
     * @param {{isValid: boolean, errors: Array<object>|null}} validationResult
     * @returns {{success: boolean, issues: Array<object>}}
     */
    createResponse(schemaKey, validationResult) {
        const issues = validationResult.isValid 
            ? [] 
            : this.processErrors(schemaKey, validationResult.errors);

        return {
            success: validationResult.isValid,
            issues: issues,
        };
    }
};
