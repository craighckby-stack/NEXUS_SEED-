const { BaseCustomError } = require('./BaseCustomError');

/**
 * InvalidArtifactError
 * Custom error class specifically for failures during artifact validation (e.g., missing required ABI fields,
 * corrupted bytecode definitions, or incorrect metadata structure).
 */
class InvalidArtifactError extends BaseCustomError {
    /**
     * Standardized error code for programmatic identification across the system.
     */
    static CODE = 'E_INVALID_ARTIFACT';

    /**
     * @param {string} message - Human-readable error message explaining the validation failure.
     * @param {object} [options={}] - Error configuration options.
     * @param {object} [options.details={}] - Specific data related to the failed artifact structure (e.g., path, field name).
     * @param {Error} [options.cause] - Underlying operational error, if any.
     */
    constructor(message, options = {}) {
        super(message, options);
        
        // Ensure the instance includes the standardized error code for serialization and programmatic handling.
        this.code = InvalidArtifactError.CODE;
        
        // Explicitly set the name for reliable stack tracing and consistency (as per existing architectural requirements).
        this.name = 'InvalidArtifactError'; 
    }
}

module.exports = { InvalidArtifactError };
