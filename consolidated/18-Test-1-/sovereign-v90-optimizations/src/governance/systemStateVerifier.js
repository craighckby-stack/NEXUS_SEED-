/**
 * Component ID: SSVK
 * Component Name: System State Verifier Kernel
 * GSEP Role: EPDP D (Verification Lock) - AIA ENFORCED
 * Location: src/governance/systemStateVerifierKernel.js
 *
 * Function: Generates and validates cryptographic state hashes (SSH) of the critical operating environment (Codebase + Config + Context).
 * This Kernel ensures a verifiable root-of-trust mapping before an architectural mutation is staged or deployed, providing
 * the absolute reference point for atomic rollback operations.
 */

import { IProposalHistoryConfigRegistryKernel } from '../registry/IProposalHistoryConfigRegistryKernel';
import { IMutationChainPersistenceToolKernel } from '../tools/IMutationChainPersistenceToolKernel';
import { ResourceAttestationKernel } from '../tools/ResourceAttestationKernel';
import { HashIntegrityCheckerToolKernel } from '../tools/HashIntegrityCheckerToolKernel';
import { AIAKernel } from '../kernel/AIAKernel'; // Mandatory AIA Inheritance

interface SystemStateVerifierDependencies {
    proposalHistoryRegistry: IProposalHistoryConfigRegistryKernel;
    mutationChainPersistence: IMutationChainPersistenceToolKernel;
    resourceAttestationKernel: ResourceAttestationKernel;
    hashIntegrityChecker: HashIntegrityCheckerToolKernel;
}

export class SystemStateVerifierKernel extends AIAKernel {
    
    private proposalHistoryRegistry: IProposalHistoryConfigRegistryKernel;
    private mutationChainPersistence: IMutationChainPersistenceToolKernel;
    private resourceAttestationKernel: ResourceAttestationKernel;
    private hashIntegrityChecker: HashIntegrityCheckerToolKernel;

    constructor(dependencies: SystemStateVerifierDependencies) {
        super('SSVK');
        this.proposalHistoryRegistry = dependencies.proposalHistoryRegistry;
        this.mutationChainPersistence = dependencies.mutationChainPersistence;
        this.resourceAttestationKernel = dependencies.resourceAttestationKernel;
        this.hashIntegrityChecker = dependencies.hashIntegrityChecker;
    }

    /**
     * Mandatory asynchronous initialization.
     * @returns {Promise<void>}
     */
    async initialize(): Promise<void> {
        this.logger.debug('SSVK initializing...');
        
        if (!this.proposalHistoryRegistry || !this.mutationChainPersistence || !this.resourceAttestationKernel || !this.hashIntegrityChecker) {
             throw new Error("[SSVK] Initialization failed: Missing core asynchronous tool kernel dependencies.");
        }

        // All dependencies are tool kernels and should already be initialized or initialized by the framework.
        this.logger.info('System State Verifier Kernel initialized successfully.');
    }

    /**
     * Helper to call the HashIntegrityCheckerToolKernel to calculate the definitive System State Hash (SSH).
     * This abstracts the underlying cryptographic mechanism (e.g., crypto, hashing algorithm).
     * @param {{ configHash: string, codeHash: string, proposalID: string }} context
     * @returns {Promise<string>}
     */
    private async calculateSystemStateHash(context: { configHash: string, codeHash: string, proposalID: string }): Promise<string> {
        // Delegate calculation to the specialized, asynchronous Tool Kernel.
        return this.hashIntegrityChecker.calculateHashForObject(context);
    }
    
    /**
     * 1. Fetches canonical context (C, H, P) using ResourceAttestationKernel.
     * 2. Calculates the definitive System State Hash (SSH) using HashIntegrityCheckerToolKernel.
     * 3. Persists the detailed snapshot to the IProposalHistoryConfigRegistryKernel.
     * 4. Registers this state hash with the IMutationChainPersistenceToolKernel, locking the verifiable state.
     * @param {string} proposalID - The identifier for the mutation proposal being verified/locked.
     * @returns {Promise<string>} The verified system state hash.
     */
    async verifyAndLockState(proposalID: string): Promise<string> {
        if (!proposalID) {
             throw new Error("Proposal ID is required to lock system state.");
        }
        
        try {
            // Step 1: Gather context (Asynchronous)
            const context = await this.resourceAttestationKernel.resolveVerificationContext(proposalID);
            
            // Step 2: Calculate definitive SSH (Asynchronous)
            const ssh = await this.calculateSystemStateHash(context);

            // Step 3: Snapshot Persistence (Asynchronous Audit Trail)
            const snapshotPayload = {
                proposalID: context.proposalID,
                configHash: context.configHash,
                codeHash: context.codeHash,
                systemStateHash: ssh, 
                timestamp: Date.now() 
            }; 
            await this.proposalHistoryRegistry.saveStateSnapshot(snapshotPayload); // Delegates to high-integrity SSRK abstraction
    
            // Step 4: Register SSH on the ledger (State commitment via MCR abstraction)
            await this.mutationChainPersistence.registerSystemStateHash(proposalID, ssh);
            
            this.logger.info(`State locked for ${proposalID}. SSH=${ssh.substring(0, 10)}...`);
    
            return ssh;
        } catch (error) {
            this.logger.critical(`CRITICAL FAILURE during state verification for ${proposalID}: ${error instanceof Error ? error.message : String(error)}`, { error });
            throw new Error(`State verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Verifies if the current deployed live state matches an expected/registered state hash.
     * @param {string | null} [expectedHash=null] - The hash registered during the lock phase (EPDP D).
     * @returns {Promise<boolean>}
     */
    async validateCurrentStateAgainstHash(expectedHash: string | null = null): Promise<boolean> {
        
        try {
            // Step 1: Gather context based on live operational environment (Asynchronous)
            const context = await this.resourceAttestationKernel.resolveVerificationContext();
            const activeProposalID = context.proposalID; // Use resolved proposal ID if not provided

            // Determine the target hash for comparison (Asynchronous fetching)
            let targetHash = expectedHash;
            if (!targetHash && activeProposalID) {
                targetHash = await this.mutationChainPersistence.fetchRegisteredSystemStateHash(activeProposalID);
            }
            
            if (!targetHash) {
                this.logger.warn(`Cannot validate state for ID ${activeProposalID}. No expected hash found (neither provided nor registered).`);
                return false;
            }

            // Step 2: Recalculate hash based on current live state (Asynchronous)
            const liveRecalculatedHash = await this.calculateSystemStateHash(context);

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
             this.logger.critical(`CRITICAL ERROR during state validation: ${error instanceof Error ? error.message : String(error)}`, { error });
             return false;
        }
    }
}