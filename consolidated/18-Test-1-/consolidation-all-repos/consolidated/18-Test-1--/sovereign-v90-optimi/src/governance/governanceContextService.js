import { ConfigurationIntegrityKernel } from './configurationIntegrityKernel'; 
import { ActiveStateContextManagerKernel } from './activeStateContextManagerKernel';
import { ILoggerToolKernel } from '../interfaces/iLoggerToolKernel'; 

/**
 * Component Name: Governance Context Kernel (GCK)
 * 
 * Function: Centralizes the asynchronous retrieval of all components required to define the system's operational state 
 * (Configuration Hash, Codebase Hash, Active Proposal ID). This component adheres to AIA mandates by relying strictly 
 * on injected, asynchronous Kernels/Tools for context resolution, isolating the Strategic State Validator (SSV).
 */
export class GovernanceContextKernel {

    /**
     * @param {ConfigurationIntegrityKernel} configurationIntegrityKernel Provides canonical system integrity hashes.
     * @param {ActiveStateContextManagerKernel} activeStateContextManagerKernel Manages the active proposal state.
     * @param {ILoggerToolKernel} logger Auditable logger instance.
     */
    constructor(
        configurationIntegrityKernel,
        activeStateContextManagerKernel,
        logger
    ) {
        // Strict architectural check for mandatory dependencies
        if (!configurationIntegrityKernel || !activeStateContextManagerKernel || !logger) {
            throw new Error("[GCK] Mandatory dependencies (ConfigurationIntegrityKernel, ActiveStateContextManagerKernel, Logger) missing.");
        }
        this._configKernel = configurationIntegrityKernel;
        this._activeStateKernel = activeStateContextManagerKernel;
        this._logger = logger;
    }

    /**
     * Gathers the necessary hashes and the Proposal ID required to define a system state context.
     * All context retrieval is now asynchronous and delegated to high-integrity kernels.
     * 
     * @param {string | null} [explicitProposalID=null] - Explicit ID used for locking a *new* state, or null to find active state.
     * @returns {Promise<{configHash: string, codeHash: string, proposalID: string}>}
     */
    async resolveVerificationContext(explicitProposalID = null) {
        
        this._logger.debug(`[GCK] Resolving verification context (Explicit ID: ${explicitProposalID || 'Active State'})...`);

        // 1. Asynchronously fetch static integrity components. 
        // Assumes ConfigurationIntegrityKernel exposes methods for both config and codebase integrity state.
        const configHashPromise = this._configKernel.getCanonicalConfigHash();
        const codeHashPromise = this._configKernel.getCanonicalCodebaseHash(); 

        const [configHash, codeHash] = await Promise.all([configHashPromise, codeHashPromise]);
        
        let proposalID;
        
        if (explicitProposalID) {
            proposalID = explicitProposalID;
        } else {
            // 2. Retrieve the active ID from the operational runtime context (now asynchronous)
            proposalID = await this._activeStateKernel.getActiveProposalID();
        }

        if (!proposalID) {
            // Use structured logging and error handling referencing a canonical concept ID (GOV_E_010)
            const errorDetails = { conceptId: "GOV_E_010", message: "Unable to determine operational context (Active Proposal ID missing)." };
            this._logger.error("[GCK] Operational context missing.", errorDetails);
            throw new Error(`[GOV_E_010] ${errorDetails.message}`);
        }

        this._logger.trace(`[GCK] Context resolved: {P:${proposalID.substring(0, 8)}, C:${configHash.substring(0, 8)}, H:${codeHash.substring(0, 8)}}`);
        return { configHash, codeHash, proposalID };
    }
}