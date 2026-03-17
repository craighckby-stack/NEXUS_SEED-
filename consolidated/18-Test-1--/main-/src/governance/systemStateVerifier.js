/**
 * Component ID: SSV
 * Component Name: System State Verifier
 * GSEP Role: EPDP D (Verification Lock)
 * Location: src/governance/systemStateVerifier.js
 *
 * Function: Generates and validates cryptographic state hashes of the critical operating environment (Codebase + Config + Context).
 * This module ensures a verifiable root-of-trust mapping before an architectural mutation is staged or deployed.
 * It provides the absolute reference point for atomic rollback operations by registering the System State Hash (SSH).
 */

import * as crypto from 'crypto';
// Import Logger as standard practice for a v94.1 component
import { Logger } from '../utility/logger'; 

export class SystemStateVerifier {
    
    // Define the specific algorithm and protocol version for deterministic hashing
    static HASH_ALGORITHM = 'sha256';
    static STATE_PROTOCOL_VERSION = 'v1.0';

    /**
     * @param {object} dependencies
     * @param {object} dependencies.mutationChainRegistrar - MCR instance (for registration).
     * @param {object} dependencies.stateSnapshotRepository - SSR instance (for audit/persistence).
     * @param {object} dependencies.governanceContextService - GCS instance (for resolving C, H, P).
     */
    constructor({ mutationChainRegistrar, stateSnapshotRepository, governanceContextService }) {
        this.mcr = mutationChainRegistrar;
        this.ssr = stateSnapshotRepository;
        this.contextService = governanceContextService; // New Dependency

        if (!this.mcr || !this.ssr || !this.contextService) {
             throw new Error("[SSV] Missing core dependency initialization.");
        }
        this.logger = Logger.get('SSV');
    }

    /**
     * Calculates the definitive System State Hash (SSH) based on structured context.
     * Input structure is canonicalized before hashing, incorporating a protocol version.
     * @param {{configHash: string, codeHash: string, proposalID: string}} context
     * @returns {string}
     */
    static calculateSystemStateHash(context) {
        const { configHash, codeHash, proposalID } = context;

        if (!configHash || !codeHash || !proposalID) {
            throw new Error("[SSV:HashGen] Incomplete context provided for System State Hash calculation.");
        }
        
        // Canonical structure: SHA256(v1.0|ConfigHash|CodebaseHash|ProposalID)
        const combinedInput = `${SystemStateVerifier.STATE_PROTOCOL_VERSION}|${configHash}|${codeHash}|${proposalID}`;
        
        return crypto.createHash(SystemStateVerifier.HASH_ALGORITHM).update(combinedInput).digest('hex');
    }
    
    /**
     * 1. Fetches canonical context (C, H, P) using GovernanceContextService.
     * 2. Calculates the definitive System State Hash (SSH).
     * 3. Persists the detailed snapshot to the SSR.
     * 4. Registers this state hash with the MCR, locking the verifiable state.
     * @param {string} proposalID - The identifier for the mutation proposal being verified/locked.
     * @returns {Promise<string>} The verified system state hash.
     */
    async verifyAndLockState(proposalID) {
        if (!proposalID) {
             throw new Error("Proposal ID is required to lock system state.");
        }
        
        try {
            // Step 1 & 2: Gather context and calculate definitive SSH
            const context = await this.contextService.resolveVerificationContext(proposalID);
            const ssh = SystemStateVerifier.calculateSystemStateHash(context);

            // Step 3: Snapshot Persistence (for audit trail)
            await this.ssr.saveSnapshot({ ...context, ssh, timestamp: Date.now() });
    
            // Step 4: Register SSH on the ledger via MCR (State commitment)
            await this.mcr.registerSystemStateHash(proposalID, ssh);
            
            this.logger.info(`State locked for ${proposalID}. SSH=${ssh.substring(0, 10)}...`);
    
            return ssh;
        } catch (error) {
            this.logger.critical(`CRITICAL FAILURE during state verification for ${proposalID}: ${error.message}`, { error });
            throw new Error(`State verification failed: ${error.message}`);
        }
    }

    /**
     * Verifies if the current deployed live state matches an expected/registered state hash.
     * If expectedHash is null, it retrieves the active registered hash from MCR using the active ProposalID.
     * @param {string | null} [expectedHash=null] - The hash registered during the lock phase (EPDP D).
     * @returns {Promise<boolean>}
     */
    async validateCurrentStateAgainstHash(expectedHash = null) {
        
        try {
            // Step 1: Gather context based on live operational environment
            const context = await this.contextService.resolveVerificationContext();
            const activeProposalID = context.proposalID;

            // Determine the target hash for comparison
            const targetHash = expectedHash || await this.mcr.fetchRegisteredSystemStateHash(activeProposalID);
            
            if (!targetHash) {
                this.logger.warn(`Cannot validate state for ID ${activeProposalID}. No expected hash found (neither provided nor registered).`);
                return false;
            }

            // Step 2: Recalculate hash based on current live state
            const liveRecalculatedHash = SystemStateVerifier.calculateSystemStateHash(context);

            if (liveRecalculatedHash === targetHash) {
                this.logger.verified(`State Integrity verified successfully. Context ID: ${activeProposalID}`);
                return true;
            } 
            
            // State Integrity Failure: Log details clearly
            this.logger.error(
                `State Integrity Mismatch (ID: ${activeProposalID}). Expected: ${targetHash.substring(0, 10)}..., Found: ${liveRecalculatedHash.substring(0, 10)}...`
            );
            return false;

        } catch (error) {
             this.logger.critical(`CRITICAL ERROR during state validation: ${error.message}`, { error });
             return false;
        }
    }
}