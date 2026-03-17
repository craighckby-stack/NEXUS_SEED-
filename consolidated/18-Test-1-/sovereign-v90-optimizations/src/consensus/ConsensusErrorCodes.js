/**
 * IConsensusErrorCodesRegistryKernel
 * Interface for retrieving immutable consensus error codes.
 */
class IConsensusErrorCodesRegistryKernel {
    /**
     * Retrieves the immutable map of consensus error codes.
     * @returns {Readonly<Record<string, string>>}
     */
    getErrorCodes() {
        throw new Error('Method must be implemented by the kernel.');
    }
}

/**
 * ConsensusErrorCodesRegistryKernel
 * A centralized, immutable registry for all machine-readable error codes 
 * used throughout the Sovereign AGI Consensus Stack.
 * 
 * This Kernel encapsulates the configuration data, isolates synchronous setup,
 * and enforces immutability via internal freezing, satisfying architectural requirements.
 */
class ConsensusErrorCodesRegistryKernel extends IConsensusErrorCodesRegistryKernel {
    /** @type {Readonly<Record<string, string>>} */
    #errorCodes;
    
    constructor() {
        super();
        // All synchronous setup and constant definition is strictly isolated here.
        this.#setupDependencies();
    }

    /**
     * Utility to map an array of strings (keys) to an object where keys and values are identical.
     * E.g., ['A', 'B'] -> { A: 'A', B: 'B' }
     * @param {string[]} keys
     * @returns {Record<string, string>}
     */
    #mapKeysToSelf(keys) {
        return keys.reduce((acc, key) => {
            acc[key] = key;
            return acc;
        }, {});
    }

    /**
     * Initializes the immutable error codes.
     * This method isolates all synchronous constant definitions and setup logic.
     */
    #setupDependencies() {
        const CODE_KEYS = [
            // --- General Errors ---
            'E_UNKNOWN',
            'E_TIMEOUT',
            'E_INVALID_ARGUMENT',
            'E_INVALID_STATE',

            // --- Cryptography and Verification Errors ---
            'E_ATTESTATION_FAILED',
            'E_SIG_INVALID',
            'E_PROOF_MALFORMED',
            'E_KEY_NOT_FOUND', 
            
            // --- Core Processing Errors (Transaction/Block/Proposal) ---
            'E_TX_INVALID_FORMAT',
            'E_PROPOSAL_DUPLICATE',
            'E_BLOCK_EXECUTION_FAILURE',
            'E_BLOCK_INVALID_HEIGHT',

            // --- Networking and Peer Errors ---
            'E_PEER_UNREACHABLE',
            'E_NON_VALIDATOR_VOTE',
            'E_MESSAGE_INTEGRITY_FAIL',
        ];

        const definition = this.#mapKeysToSelf(CODE_KEYS);
        
        // Enforce immutability, replacing external ImmutableRegistry utility
        this.#errorCodes = Object.freeze(definition);
    }

    /**
     * @returns {Readonly<Record<string, string>>} The immutable map of consensus error codes.
     */
    getErrorCodes() {
        return this.#errorCodes;
    }
}

module.exports = { ConsensusErrorCodesRegistryKernel, IConsensusErrorCodesRegistryKernel };
