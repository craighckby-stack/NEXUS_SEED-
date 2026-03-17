/**
 * IdentifierConfigRegistryKernel
 * Encapsulates and manages immutable configuration settings for ID Generation and Integrity Services.
 * This eliminates the raw constant configuration file anti-pattern.
 */
class IdentifierConfigRegistryKernel {
    #config;

    /**
     * @param {Object} [dependencies={}] - Dependencies (enforcing the standard DI pattern).
     */
    constructor(dependencies = {}) {
        // All synchronous initialization and data encapsulation is moved here.
        this.#setupDependencies(dependencies);
    }

    /**
     * Extracts all synchronous initialization logic and dependency checks.
     * Defines the immutable configuration payload.
     * @private
     */
    #setupDependencies(dependencies) {
        // Define the raw configuration data
        const rawConfig = {
            // Default algorithm for stable content hashing (e.g., SHA256, SHA512, Blake3)
            DEFAULT_HASH_ALGORITHM: 'SHA256',

            // Encoding for output hashes (e.g., hex, base64)
            HASH_OUTPUT_ENCODING: 'hex',

            // Optional complexity parameter (e.g., rounds for slower hashing or salts)
            COMPLEXITY_FACTOR: 1 
        };

        // Enforce immutability using recursive freezing, replacing reliance on external utilities.
        this.#config = this.#deepFreeze(rawConfig);
    }

    /**
     * Recursively freezes an object to ensure immutability.
     * @private
     * @param {Object} obj
     * @returns {Object} Frozen object.
     */
    #deepFreeze(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        const propNames = Object.getOwnPropertyNames(obj);

        for (const name of propNames) {
            const value = obj[name];
            if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
                this.#deepFreeze(value);
            }
        }

        return Object.freeze(obj);
    }

    /**
     * Retrieves the complete identifier configuration object.
     * @returns {Object} Immutable configuration object.
     */
    getConfig() {
        return this.#config;
    }

    /**
     * Retrieves the default hashing algorithm.
     * @returns {string}
     */
    getDefaultHashAlgorithm() {
        return this.#config.DEFAULT_HASH_ALGORITHM;
    }

    /**
     * Retrieves the hash output encoding.
     * @returns {string}
     */
    getHashOutputEncoding() {
        return this.#config.HASH_OUTPUT_ENCODING;
    }

    /**
     * Retrieves the complexity factor for integrity services.
     * @returns {number}
     */
    getComplexityFactor() {
        return this.#config.COMPLEXITY_FACTOR;
    }
}

module.exports = IdentifierConfigRegistryKernel;