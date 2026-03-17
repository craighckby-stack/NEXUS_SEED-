/**
 * Component: CLARA (Conflict Logging and Resolution Arbitration)
 * Purpose: Manages conflict policies ('Weighted_Delegation_v2', 'Immediate_Mitigation')
 * by delegating execution to an injectable Policy Engine, based on the governance matrix.
 */

// Standardized Policy and Status Constants
const CLARA_POLICIES = {
    WEIGHTED_DELEGATION: 'Weighted_Delegation_v2',
    IMMEDIATE_MITIGATION: 'Immediate_Mitigation'
};

const RESOLUTION_STATUS = {
    RESOLVED: 'RESOLVED',
    REJECTED: 'REJECTED', // Added specific rejection status for clarity
    ERROR: 'ERROR',
    POLICY_NOT_FOUND: 'POLICY_NOT_FOUND' 
};

class ClaraResolver {
    /**
     * @param {object} governanceConfig - The parsed governance matrix structure.
     * @param {object} policyEngine - An instance of the PolicyEngine utility (Scaffolded component).
     * @param {object} logger - System logging utility.
     */
    constructor(governanceConfig, policyEngine, logger = console) {
        if (!governanceConfig || !governanceConfig.governance_matrix) {
            throw new Error("ClaraResolver initialization error: requires valid governance configuration.");
        }
        if (!policyEngine || typeof policyEngine.execute !== 'function') {
             throw new Error("ClaraResolver initialization error: requires a valid PolicyEngine instance with an 'execute' method.");
        }
        
        this.governanceMatrix = governanceConfig.governance_matrix;
        this.policyEngine = policyEngine;
        this.logger = logger;
        this.policies = CLARA_POLICIES; 
    }

    /**
     * Retrieves the conflict policy defined for a specific proposal type.
     * @param {string} proposalType
     * @returns {string | null} The policy name or null if not found.
     */
    _getPolicy(proposalType) {
        const matrixEntry = this.governanceMatrix[proposalType];
        return matrixEntry ? matrixEntry.conflict_policy : null;
    }

    /**
     * Main arbitration entry point. Delegates resolution to the Policy Engine.
     * @param {object} proposal - The proposed change object.
     * @param {object} currentState - Snapshot of the system state.
     * @param {object} metricData - Current performance and risk metrics.
     * @returns {Promise<{status: string, policy_applied: string, details: any}>} Resolution outcome.
     */
    async resolveConflict(proposal, currentState, metricData) {
        const proposalId = proposal.id || `temp-${Date.now()}`; 
        const policyName = this._getPolicy(proposal.type);

        if (!policyName) {
            this.logger.warn(`CLARA: Missing governance matrix entry for proposal type: ${proposal.type}`);
            return { 
                status: RESOLUTION_STATUS.ERROR, 
                policy_applied: 'N/A',
                details: { reason: 'Missing governance matrix entry', type: proposal.type } 
            };
        }

        let resolutionResult;

        try {
            // Delegation: Execute the specific policy via the injected engine
            resolutionResult = await this.policyEngine.execute(
                policyName, 
                { proposal, currentState, metricData }
            );

        } catch (error) {
            if (error.message.includes("Policy not registered")) {
                resolutionResult = { 
                    status: RESOLUTION_STATUS.POLICY_NOT_FOUND, 
                    details: { reason: `Policy registered in matrix but not found in engine: ${policyName}` } 
                };
            } else {
                 resolutionResult = { 
                    status: RESOLUTION_STATUS.ERROR, 
                    details: { reason: `Policy execution failed for ${policyName}: ${error.message}` } 
                }; 
            }
        }
        
        this._logResolution(proposalId, policyName, resolutionResult.status, resolutionResult.details);
        
        return {
            status: resolutionResult.status,
            policy_applied: policyName,
            details: resolutionResult.details || {}
        };
    }
    
    /** 
     * Logs the outcome of a specific conflict resolution.
     */
    _logResolution(id, policy, outcome, details) {
        // Use consistent formatting for easier log parsing
        this.logger.info(`[CLARA] ID: ${id} | Policy: ${policy} | Outcome: ${outcome}`, { details });
    }
    
    // Removed the internal _handleWeightedDelegation and _handleImmediateMitigation stubs.
}

// Expose policies and status codes for external checks
ClaraResolver.POLICIES = CLARA_POLICIES;
ClaraResolver.STATUS = RESOLUTION_STATUS;

module.exports = ClaraResolver;