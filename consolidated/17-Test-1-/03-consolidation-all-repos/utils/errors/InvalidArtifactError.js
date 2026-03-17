const { BaseCustomError } = require('./BaseCustomError');

/**
 * InvalidArtifactError
 * Custom error class specifically for failures during contract artifact validation.
 * Used when required fields are missing, formats are incorrect, or definitions are corrupted.
 */
class InvalidArtifactError extends BaseCustomError {
    /**
     * Standardized error code for programmatic identification.
     */
    static CODE = 'E_INVALID_ARTIFACT';

    /**
     * Constructor inherits implementation from BaseCustomError, 
     * ensuring message, details, and cause are handled consistently.
     *
     * @param {string} message - Human-readable error message.
     * @param {object} [options={}] - Error configuration options.
     * @param {object} [options.details={}] - Specific details about the validation failure.
     * @param {Error} [options.cause] - Underlying error.
     */
    constructor(message, options = {}) {
        super(message, options);
    }
}

module.exports = { InvalidArtifactError };
