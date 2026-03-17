/**
 * CFTMValidatorKernel
 * Ensures the Core Failure Thresholds Manifest adheres to the strict governance schema
 * before ingestion by the CFTMAccessor. Separates structural validation from runtime access.
 * This utility handles external data integrity (e.g., versioning, required keys, format).
 */

const { CFTMConfigurationError } = require('./cftm_accessor'); 

// NOTE: RequiredKeys remains local as it defines the specific mandate for this component.
const RequiredKeys = [
    'DENOMINATOR_STABILITY_TAU',
    'MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON',
    // Add all critical mandated keys here
];

// The structural validation logic has been abstracted into a reusable plugin.
const MandatedThresholdsStructureValidator = require('./MandatedThresholdsStructureValidator');

class CFTMValidatorKernel {
    #validatorTool;
    #ErrorType;
    #RequiredKeys;

    /**
     * Initializes the validator kernel and resolves mandatory dependencies.
     */
    constructor() {
        this.#setupDependencies();
    }

    /**
     * Satisfies the Synchronous Setup Extraction Goal.
     * Resolves external dependencies and internal constants.
     */
    #setupDependencies() {
        // Dependency resolution
        this.#validatorTool = MandatedThresholdsStructureValidator;
        this.#ErrorType = CFTMConfigurationError;
        this.#RequiredKeys = RequiredKeys;

        // Basic check for tool availability
        if (!this.#validatorTool || typeof this.#validatorTool.execute !== 'function') {
            this.#throwSetupError("MandatedThresholdsStructureValidator is not properly defined or lacks an 'execute' method.");
        }
    }

    /**
     * Public entry point for validation.
     * @param {object} rawConfig - The object containing the 'thresholds' property.
     * @throws {CFTMConfigurationError} if validation fails.
     * @returns {object} The validated configuration object.
     */
    validateManifest(rawConfig) {
        // Delegates to the I/O proxy for execution
        return this.#delegateToValidationExecution(rawConfig);
    }

    /**
     * I/O Proxy Function.
     * Delegates core structural validation to the external tool and handles immediate control flow.
     * @param {object} rawConfig
     */
    #delegateToValidationExecution(rawConfig) {
        try {
            return this.#validatorTool.execute(rawConfig, this.#RequiredKeys);
        } catch (e) {
            this.#wrapAndThrowError(e);
        }
    }

    /**
     * Control Flow Proxy Function.
     * Catches generic errors from the validator tool and re-wraps them into domain-specific errors.
     * @param {Error} e - The caught error object.
     */
    #wrapAndThrowError(e) {
        if (e instanceof Error) {
            // If the error object has custom key metadata, pass it along
            if (e.key) {
                throw new this.#ErrorType(`Validation failed for required key: ${e.key}. ${e.message}`, e.key);
            }
            // Otherwise, wrap the standard message
            throw new this.#ErrorType(`Manifest validation failed: ${e.message}`);
        }
        // Re-throw unhandled exceptions
        throw e;
    }

    /**
     * Control Flow Proxy Function.
     * Throws a configuration error during setup.
     * @param {string} message
     */
    #throwSetupError(message) {
        throw new this.#ErrorType(`CFTMValidator setup failed: ${message}`);
    }
}

module.exports = CFTMValidatorKernel;
