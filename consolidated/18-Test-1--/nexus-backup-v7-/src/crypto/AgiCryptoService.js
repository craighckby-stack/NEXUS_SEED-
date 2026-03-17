/**
 * AGS: AGI CRYPTO SERVICE KERNEL (V95.3)
 * Scope: Stage 1/Security Core Utility.
 * Function: Provides standardized, high-assurance cryptographic primitives required
 * by the System State Verifier (SSV), Governance Rule System (GRS), and other sensitive components.
 *
 * NOTE: All cryptographic operations are now delegated to the CryptoUtilityInterfaceKernel
 * to ensure platform abstraction, integrity, and compliance.
 */

/**
 * @typedef {import("../../tools/CryptoUtilityInterfaceKernel").ICryptoUtilityInterfaceKernel} ICryptoUtilityInterfaceKernel
 */

class AgiCryptoServiceKernel {
    // Constants are now private fields to enforce encapsulation.
    #ALGORITHM_HASH = 'sha256';
    #ALGORITHM_SIGNATURE = 'ecdsa';

    /** @type {ICryptoUtilityInterfaceKernel} */
    #cryptoUtility;

    /**
     * @param {object} dependencies
     * @param {ICryptoUtilityInterfaceKernel} dependencies.cryptoUtility - Injected kernel tool for crypto operations.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates dependency assignment and validation, satisfying the synchronous setup extraction mandate.
     * @param {object} dependencies
     */
    #setupDependencies(dependencies) {
        if (!dependencies || !dependencies.cryptoUtility) {
            throw new Error("AgiCryptoServiceKernel requires the 'cryptoUtility' dependency (ICryptoUtilityInterfaceKernel).");
        }
        const cryptoUtility = dependencies.cryptoUtility;

        // CRITICAL: Ensure the utility is available and implements the required methods.
        if (typeof cryptoUtility.calculateHash !== 'function' || typeof cryptoUtility.verifySignature !== 'function') {
            throw new Error("AgiCryptoServiceKernel: Injected cryptoUtility must provide calculateHash and verifySignature methods.");
        }

        this.#cryptoUtility = cryptoUtility;
    }

    /**
     * Required initialization hook for the Kernel architecture.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Asynchronous initialization steps would go here if required.
        return Promise.resolve();
    }

    /**
     * Calculates a cryptographic hash of the input data.
     * NOTE: Transitioned to asynchronous execution for strategic consistency.
     * @param {string} data - The input data string.
     * @param {string} [algorithm] - Hashing algorithm (e.g., 'sha256'). Defaults to internal standard.
     * @returns {Promise<string>} The computed hash digest (hexadecimal).
     */
    async hash(data, algorithm = this.#ALGORITHM_HASH) {
        // Wrap synchronous crypto call in a Promise to enforce strategic async signature.
        try {
            const result = this.#cryptoUtility.calculateHash(data, algorithm);
            return Promise.resolve(result);
        } catch (error) {
            // Use error wrapping for context in high-level kernel
            throw new Error(`AgiCryptoServiceKernel hash operation failed: ${error.message}`);
        }
    }

    /**
     * Verifies an external cryptographic signature against the data and a known public key.
     * NOTE: Transitioned to asynchronous execution for strategic consistency.
     * @param {string} data - The original data payload.
     * @param {string} signature - The signature to verify.
     * @param {string} attestationKeyId - Identifier for the public key used for verification.
     * @returns {Promise<boolean>} True if the signature is valid, false otherwise.
     */
    async verifySignature(data, signature, attestationKeyId) {
        // Wrap synchronous crypto call in a Promise to enforce strategic async signature.
        try {
            const result = this.#cryptoUtility.verifySignature(data, signature, attestationKeyId);
            return Promise.resolve(result);
        } catch (error) {
            // Use error wrapping for context in high-level kernel
            throw new Error(`AgiCryptoServiceKernel signature verification failed: ${error.message}`);
        }
    }
}

module.exports = AgiCryptoServiceKernel;