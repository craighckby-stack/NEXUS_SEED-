/**
 * Utility class to adapt verbose external validation errors (e.g., Joi, Zod) 
 * into a structured, lightweight format expected by system errors like PayloadSchemaError.
 * This decouples the governance error structure from specific validation libraries.
 */
class ErrorDetailAdapter {
    
    /**
     * Maps raw validation error objects (which are often verbose) into a 
     * normalized array of failure structures for the PayloadSchemaError.
     * 
     * @param {Object} externalError - The raw validation error object (e.g., Joi validation error).
     * @returns {Array<{field: string, reason: string, rule: string}>} A structured array of failure details.
     */
    static normalize(externalError) {
        if (!externalError || !externalError.details || !Array.isArray(externalError.details)) {
            // Handle cases where the error isn't structured (return general failure)
            return externalError ? [{
                field: 'general',
                reason: externalError.message || 'Unstructured validation error',
                rule: 'ADAPTER_FAILURE'
            }] : [];
        }
        
        return externalError.details.map(detail => ({
            // Assuming Joi-like structure for path derivation
            field: detail.path && detail.path.length > 0 ? detail.path.join('.') : detail.context?.key || 'unknown',
            reason: detail.message.replace(/"/g, ''), // Clean up common validation quoting
            rule: detail.type || 'schema_type_mismatch'
        }));
    }
}

module.exports = { ErrorDetailAdapter };