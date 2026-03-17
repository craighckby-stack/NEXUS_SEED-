/**
 * AGI-KERNEL: ConsensusConfigRegistryKernel
 * @description Encapsulates and provides immutable access to consensus-critical 
 * parameters, replacing the static configuration file dependency (ConsensusConfig.js).
 * This eliminates raw configuration constants from the system boundary.
 */
class ConsensusConfigRegistryKernel {
    /**
     * @private
     * The immutable consensus configuration data. Nested objects are recursively frozen.
     */
    static #CONSENSUS_CONFIG = Object.freeze({
        // --- PROTOCOL STANDARDS ---
        PROTOCOL_VERSION: 1.0,
        NETWORK_ID: 'sovereign_mainnet_v1',

        // --- CRYPTOGRAPHIC PRIMITIVES ---
        HASH: Object.freeze({
            ALGORITHM: 'sha256',
            DIGEST_LENGTH_BYTES: 32, // 256 bits / 8
        }),

        SIGNATURE: Object.freeze({
            ALGORITHM: 'ed25519',
            PUBLIC_KEY_SIZE_BYTES: 32,
            SIGNATURE_SIZE_BYTES: 64,
        }),
        
        // --- TIMING & ROUNDS ---
        CONSENSUS_ROUND_TIMEOUT_MS: 5000,
        TARGET_BLOCK_INTERVAL_MS: 2000,
        
        // --- STRUCTURAL LIMITS ---
        MAX_BLOCK_SIZE_BYTES: 1048576, // 1 MiB
        MAX_TRANSACTIONS_PER_BLOCK: 5000,
        
        EPOCH_LENGTH_BLOCKS: 1024,
    });

    /**
     * Initializes the kernel.
     */
    constructor() {
        this.#setupDependencies();
    }

    /**
     * @private
     * Performs synchronous setup and dependency validation.
     */
    #setupDependencies() {
        // This registry kernel is purely data-driven and has no external dependencies to validate.
    }

    /**
     * Retrieves the complete, immutable consensus configuration object.
     * @returns {Readonly<object>}
     */
    getConsensusConfig() {
        return ConsensusConfigRegistryKernel.#CONSENSUS_CONFIG;
    }

    /**
     * Retrieves the cryptographic primitives configuration subset.
     * @returns {Readonly<object>}
     */
    getCryptoPrimitives() {
        const config = ConsensusConfigRegistryKernel.#CONSENSUS_CONFIG;
        return Object.freeze({
            HASH: config.HASH,
            SIGNATURE: config.SIGNATURE,
        });
    }

    /**
     * Retrieves a specific top-level configuration value.
     * @param {string} key
     * @returns {*} The configuration value.
     * @throws {Error} If the key is not found at the top level.
     */
    get(key) {
        const config = ConsensusConfigRegistryKernel.#CONSENSUS_CONFIG;
        if (Object.prototype.hasOwnProperty.call(config, key)) {
            return config[key];
        }
        throw new Error(`Consensus configuration key not found: ${key}`);
    }
}

module.exports = ConsensusConfigRegistryKernel;