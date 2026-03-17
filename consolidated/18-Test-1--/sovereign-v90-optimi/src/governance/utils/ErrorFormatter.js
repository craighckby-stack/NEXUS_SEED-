/**
 * @fileoverview High-integrity, asynchronous Kernel responsible for standardizing and serializing error objects.
 * This kernel strictly delegates all formatting and security masking logic to the IErrorDetailNormalizationToolKernel,
 * adhering to the principles of Maximum Recursive Abstraction (MRA).
 */

/**
 * Placeholder interface constant for dependency resolution.
 * @type {string}
 */
const IErrorDetailNormalizationToolKernel = 'IErrorDetailNormalizationToolKernel'; 

/**
 * @class ErrorFormatterKernel
 * @description Provides a high-integrity, asynchronous interface for standardizing error objects
 * using the specialized IErrorDetailNormalizationToolKernel.
 */
class ErrorFormatterKernel {
    /**
     * @param {IErrorDetailNormalizationToolKernel} errorNormalizer - Tool for canonical error serialization.
     */
    constructor(errorNormalizer) {
        if (!errorNormalizer) {
            throw new Error("ErrorFormatterKernel requires IErrorDetailNormalizationToolKernel.");
        }
        /** @private {IErrorDetailNormalizationToolKernel} */
        this.errorNormalizer = errorNormalizer;
    }

    /**
     * @async
     * Mandatory asynchronous initialization hook. Performs interface validation.
     */
    async initialize() {
        // Validate the required interface methods exist on the injected tool
        if (typeof this.errorNormalizer.normalizeError !== 'function') {
            throw new Error("Injected IErrorDetailNormalizationToolKernel is invalid: missing 'normalizeError' method.");
        }
        // Initialization complete. No synchronous configuration loading is performed.
    }

    /**
     * Converts an Error object into a serializable plain object using the specialized kernel tool.
     * Delegates all formatting, masking, and stacking logic to the external tool.
     * 
     * @param {Error} err - The error object to format.
     * @param {Object} [options={}] - Formatting options, e.g., { includeStack: false, context: {} }.
     * @returns {Promise<Object>} Standardized error structure.
     */
    async formatError(err, options = {}) {
        // Strict delegation to achieve Maximum Recursive Abstraction (MRA).
        // The options parameter maps directly to the original includeStack boolean, plus any other context.
        const includeStack = options.includeStack || false; 
        return this.errorNormalizer.normalizeError(err, { ...options, includeStack });
    }
}

module.exports = ErrorFormatterKernel;