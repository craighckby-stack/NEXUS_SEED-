/**
 * Centralized configuration for consensus-critical parameters.
 * This configuration dictates network standards, cryptographic primitives,
 * and structural limits enforced by all nodes.
 */

const ConsensusConfig = {

    // --- PROTOCOL STANDARDS ---
    PROTOCOL_VERSION: 1.0, // Defines the current protocol capabilities
    NETWORK_ID: 'sovereign_mainnet_v1', // Used to prevent cross-network replay attacks

    // --- CRYPTOGRAPHIC PRIMITIVES ---
    HASH: {
        ALGORITHM: 'sha256',
        DIGEST_LENGTH_BYTES: 32, // 256 bits / 8
    },

    SIGNATURE: {
        ALGORITHM: 'ed25519',
        PUBLIC_KEY_SIZE_BYTES: 32, 
        SIGNATURE_SIZE_BYTES: 64, 
    },
    
    // --- TIMING & ROUNDS ---
    // Default maximum time allowed for a node to propose/vote during a consensus round
    CONSENSUS_ROUND_TIMEOUT_MS: 5000, 
    // Target desired interval between blocks
    TARGET_BLOCK_INTERVAL_MS: 2000, 
    
    // --- STRUCTURAL LIMITS ---
    // Maximum allowable size for a serialized block payload (in bytes, 1 MiB)
    MAX_BLOCK_SIZE_BYTES: 1048576,
    // Maximum number of transactions allowed per block
    MAX_TRANSACTIONS_PER_BLOCK: 5000,
    
    // The number of blocks that define an epoch for governance/validator shuffling
    EPOCH_LENGTH_BLOCKS: 1024,
};

// Ensure nested properties are immutable
Object.freeze(ConsensusConfig.HASH);
Object.freeze(ConsensusConfig.SIGNATURE);

// Ensure the main configuration object cannot be modified at runtime
module.exports = Object.freeze(ConsensusConfig);
