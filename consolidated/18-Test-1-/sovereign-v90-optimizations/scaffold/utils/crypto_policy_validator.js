const policy = require('../policies/config/crypto_policy.json');

/**
 * CryptoPolicyValidatorKernel V2.1 (Facade)
 * Ensures runtime configuration compliance against the Sovereign AGI crypto policy by delegating validation to an injected tool.
 */
class CryptoPolicyValidatorKernel {

    #policy; 
    #policyValidatorTool; 
    #toolAvailable;

    /**
     * @param {any} policyConfig - The loaded crypto policy object.
     * @param {ICanonicalCryptoPolicyValidator} policyValidatorTool - The implementation of the policy validation interface.
     */
    constructor(policyConfig, policyValidatorTool) {
        this.#setupDependencies(policyConfig, policyValidatorTool);
    }

    /**
     * Rigorously initializes private state and validates dependencies.
     * Satisfies: Synchronous Setup Extraction Goal.
     */
    #setupDependencies(policyConfig, policyValidatorTool) {
        this.#policy = policyConfig;
        this.#policyValidatorTool = policyValidatorTool;
        this.#toolAvailable = true;

        if (!this.#policyValidatorTool || 
            typeof this.#policyValidatorTool.isHashCompliant !== 'function' ||
            typeof this.#policyValidatorTool.isSymmetricCipherCompliant !== 'function') {
            
            this.#logWarning("Initialized with an invalid or missing CanonicalCryptoPolicyValidator tool. Operating in degraded/fallback mode.");
            this.#toolAvailable = false;
        }
    }

    /**
     * I/O Proxy: Logs a non-critical warning.
     */
    #logWarning(message) {
        console.warn(`[CryptoPolicyValidatorKernel] ${message}`);
    }

    /**
     * Helper: Returns the structured error response for when the tool is unavailable.
     */
    #getUnavailableToolError() {
        return { compliant: false, reason: 'Policy validation tool unavailable or improperly initialized.' };
    }

    /**
     * Core delegation method. Handles tool availability check, argument wrapping, and delegation.
     * This replaces the redundant #checkToolAvailability and specific #delegateTo* methods.
     * @param {string} methodName - The method name on the policyValidatorTool to call.
     * @param {object} args - Arguments specific to the validation method.
     * @returns {{ compliant: boolean, reason: string }}
     */
    #executeValidation(methodName, args) {
        if (!this.#toolAvailable) {
            return this.#getUnavailableToolError();
        }

        // Construct the full input object including the policy
        const input = {
            policy: this.#policy,
            ...args
        };

        // Delegate the call dynamically
        return this.#policyValidatorTool[methodName](input);
    }

    /**
     * Validates if a provided hash algorithm meets current standards.
     * @param {string} algorithmName - e.g., 'SHA-256'
     * @param {number} digestSizeBits - e.g., 256
     * @returns {{ compliant: boolean, reason: string }}
     */
    isHashCompliant(algorithmName, digestSizeBits) {
        return this.#executeValidation('isHashCompliant', {
            algorithmName,
            digestSizeBits
        });
    }

    /**
     * Validates symmetric cipher configuration (e.g., used for data transport).
     * @param {string} algorithm - e.g., 'AES'
     * @param {number} keySizeBits - e.g., 256
     * @returns {{ compliant: boolean, reason: string }}
     */
    isSymmetricCipherCompliant(algorithm, keySizeBits) {
        return this.#executeValidation('isSymmetricCipherCompliant', {
            algorithm,
            keySizeBits
        });
    }

    // Implement additional methods for signingPolicy, keyManagement, etc., delegating to the tool.
}

// NOTE: We retain the original dependency resolution pattern for compatibility
// but pass the dependency explicitly to the constructor.
const CanonicalCryptoPolicyValidator = global.plugins ? global.plugins.CanonicalCryptoPolicyValidator : undefined;

module.exports = new CryptoPolicyValidatorKernel(policy, CanonicalCryptoPolicyValidator);