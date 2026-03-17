class IntegrityStandardsRegistryKernel {
    /**
     * @property {object} #config - Internal frozen storage for integrity constants.
     */
    #config;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Initializes configuration data and enforces immutability.
     * This fulfills the synchronous setup extraction mandate.
     */
    #setupDependencies() {
        const RAW_INTEGRITY_CONSTANTS = {
            // Cryptographic Standards
            HASH_ALGORITHM: 'SHA-512',
            SHA512_LENGTH: 128, 

            // Regulatory Expressions
            REGEX: {
                // Enforces SHA-512 hex format (128 characters)
                SHA512_HASH: /^[0-9a-fA-F]{128}$/,
                // Enforces UUID version 4 format
                UUID_V4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            },
            
            // Default key names expected in system records (Ledger Entries, Policies, etc.)
            DEFAULT_KEYS: {
                ID: 'id',
                HASH: 'integrityHash',
                TIMESTAMP: 'timestamp' 
            }
        };

        // Enforce immutability
        this.#config = Object.freeze(RAW_INTEGRITY_CONSTANTS);
    }

    /**
     * Retrieves the configured standard hash algorithm.
     * @returns {string} The algorithm name (e.g., 'SHA-512').
     */
    getHashAlgorithm() {
        return this.#config.HASH_ALGORITHM;
    }

    /**
     * Retrieves the standard length for the SHA-512 hash algorithm.
     * @returns {number} The expected hash length (128).
     */
    getSha512Length() {
        return this.#config.SHA512_LENGTH;
    }

    /**
     * Retrieves a regulatory expression by name.
     * @param {('SHA512_HASH' | 'UUID_V4')} name - The key name of the regex.
     * @returns {RegExp | undefined} The regular expression object.
     */
    getRegex(name) {
        return this.#config.REGEX[name];
    }

    /**
     * Retrieves a default key name used in system records.
     * @param {('ID' | 'HASH' | 'TIMESTAMP')} name - The symbolic name of the key.
     * @returns {string | undefined} The field name (e.g., 'integrityHash').
     */
    getDefaultKey(name) {
        return this.#config.DEFAULT_KEYS[name];
    }
    
    /**
     * Retrieves the entire frozen configuration object.
     * Note: Access should typically use specific getters for future flexibility.
     * @returns {object} The complete, immutable standards configuration.
     */
    getAllStandards() {
        return this.#config;
    }
}

module.exports = IntegrityStandardsRegistryKernel;