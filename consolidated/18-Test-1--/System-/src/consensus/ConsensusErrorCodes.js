/**
 * ConsensusErrorCodes
 * A centralized, immutable registry for all machine-readable error codes 
 * used throughout the Sovereign AGI Consensus Stack.
 * 
 * Naming Convention: E_COMPONENT_FAILURETYPE
 */
const ConsensusErrorCodes = {
    // General Errors
    E_UNKNOWN: 'E_UNKNOWN',
    E_TIMEOUT: 'E_TIMEOUT',
    E_INVALID_ARGUMENT: 'E_INVALID_ARGUMENT',
    E_INVALID_STATE: 'E_INVALID_STATE',

    // Attestation and Validation Errors
    E_ATTESTATION_FAILED: 'E_ATTESTATION_FAILED',
    E_SIG_INVALID: 'E_SIG_INVALID',
    E_PROOF_MALFORMED: 'E_PROOF_MALFORMED',
    
    // Proposal and Block Processing Errors
    E_TX_INVALID_FORMAT: 'E_TX_INVALID_FORMAT',
    E_PROPOSAL_DUPLICATE: 'E_PROPOSAL_DUPLICATE',
    E_BLOCK_EXECUTION_FAILURE: 'E_BLOCK_EXECUTION_FAILURE',

    // Peer/Network Errors
    E_PEER_UNREACHABLE: 'E_PEER_UNREACHABLE',
    E_NON_VALIDATOR_VOTE: 'E_NON_VALIDATOR_VOTE',
};

// Freeze the object to prevent runtime modification, ensuring code integrity
Object.freeze(ConsensusErrorCodes);

module.exports = { ConsensusErrorCodes };