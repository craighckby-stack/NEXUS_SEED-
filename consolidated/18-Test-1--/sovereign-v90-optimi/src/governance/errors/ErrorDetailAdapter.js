/**
 * IErrorDetailNormalizationToolKernel
 * 
 * Defines the high-integrity interface for adapting verbose external validation errors 
 * (e.g., Joi, Zod) into the structured, lightweight format expected by core system 
 * errors (like PayloadSchemaError). This replaces the synchronous, globally coupled 
 * ErrorDetailAdapter utility, which relied on the global `__ErrorDetailNormalizationUtility__`.
 *
 * Adherence to the AIA Enforcement Layer mandates asynchronous operation and 
 * dependency injection for all structural normalization tasks.
 */
class IErrorDetailNormalizationToolKernel {
    
    /**
     * Maps raw external validation error objects into a normalized, structured 
     * array of failure details.
     * 
     * @param {Object} externalError - The raw validation error object.
     * @returns {Promise<Array<{field: string, reason: string, rule: string}>>} 
     *          A promise resolving to the structured array of failure details.
     */
    async normalize(externalError) {
        // Mandates that consumers utilize the injected interface, not static methods or globals.
        throw new Error("IErrorDetailNormalizationToolKernel: Method 'normalize' must be implemented and called asynchronously.");
    }
}

module.exports = { IErrorDetailNormalizationToolKernel };