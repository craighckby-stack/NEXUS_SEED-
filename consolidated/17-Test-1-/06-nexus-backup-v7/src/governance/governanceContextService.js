import { ConfigurationService } from '../config/configurationService';
import { CodebaseHasher } from '../utility/codebaseHasher';
import { ActiveStateContextManager } from './activeStateContextManager';
import { Logger } from '../utility/logger';

/**
 * Service ID: GCS
 * Component Name: Governance Context Service
 * Location: src/governance/governanceContextService.js
 *
 * Function: Centralizes the retrieval of all components required to define the system's operational state 
 * (Configuration Hash, Codebase Hash, Active Proposal ID). This abstraction layer isolates SSV from dependency fetch details, 
 * enabling SSV to focus solely on cryptographic verification.
 */
export class GovernanceContextService {

    constructor() {
        // Note: Assumes standard utility dependency resolution, but could also take Logger via DI.
        this.logger = Logger.get('GCS'); 
    }

    /**
     * Gathers the necessary hashes and the Proposal ID required to define a system state context.
     * This is the canonical source for verification context resolution.
     * 
     * @param {string | null} [explicitProposalID=null] - Explicit ID used for locking a *new* state, or null to find active state.
     * @returns {Promise<{configHash: string, codeHash: string, proposalID: string}>}
     */
    async resolveVerificationContext(explicitProposalID = null) {
        
        this.logger.debug(`Resolving verification context (Explicit ID: ${explicitProposalID || 'Active State'})...`);

        // 1. Fetch static hashes (assuming CodebaseHasher is sync or result is pre-cached/fast)
        const configHash = ConfigurationService.fetchCriticalConfigHash();
        const codeHash = CodebaseHasher.calculateActiveCodebaseHash(); 
        
        let proposalID;
        
        if (explicitProposalID) {
            proposalID = explicitProposalID;
        } else {
            // 2. Retrieve the active ID from the operational runtime context
            proposalID = ActiveStateContextManager.getActiveProposalID();
        }

        if (!proposalID) {
            this.logger.error("Operational context missing: Unable to determine Active Proposal ID.");
            throw new Error("[GCS] Unable to determine operational context.");
        }

        this.logger.trace(`Context resolved: {P:${proposalID.substring(0, 8)}, C:${configHash.substring(0, 8)}, H:${codeHash.substring(0, 8)}}`);
        return { configHash, codeHash, proposalID };
    }
}