/**
 * PolicyEngine.js
 * Purpose: Interprets the RCDM ruleset and applies dynamic scoring/enforcement logic.
 * Refactored for modularity, explicit configuration handling, and efficiency.
 */

class PolicyEngine {
    /**
     * @param {Object} rcdmConfig - The Root Configuration Data Model (RCDM).
     */
    constructor(rcdmConfig) {
        if (!rcdmConfig || !rcdmConfig.rulesets || !rcdmConfig.phases) {
            throw new Error("[PolicyEngine] Requires valid RCDM configuration with rulesets and phases.");
        }
        
        // Optimize config access by localizing critical paths
        this.rulesets = rcdmConfig.rulesets;
        this.phases = rcdmConfig.phases;
        this.weightingMatrix = rcdmConfig.weighting_matrix || {};
        
        // Ensure default parameters are easily accessible
        this.defaultThreshold = (rcdmConfig.config && rcdmConfig.config.default_threshold_pct) || 0.5;
    }

    /**
     * Determines the operational phase based on context.
     * @param {Object} context - The current operational context.
     * @returns {Object} The configuration object for the active phase.
     */
    getCurrentPhase(context) {
        const phaseId = context.current_task_type || 'evolution';
        const phase = this.phases[phaseId];
        
        if (!phase) {
             // Use a defined fallback if configuration is missing the specific phase
             return this.phases.evolution || { ruleset_id: 'default_fallback' }; 
        }
        return phase;
    }

    /**
     * Executes the evaluation based on the 'weighted_consensus' ruleset type.
     */
    _evaluateWeightedConsensus(phase, context, proposalScoreMap) {
        const ruleset = this.rulesets[phase.ruleset_id];
        let finalScore = 0;
        
        // Use the ruleset's specific threshold, falling back to engine default
        const threshold = ruleset.threshold || this.defaultThreshold;

        for (const [actor, score] of Object.entries(proposalScoreMap)) {
            // Use pre-loaded weighting matrix. Default to 0 if actor is not weighted.
            finalScore += score * (this.weightingMatrix[actor] || 0);
        }
        
        // Dynamic Adjustment Logic (Mitigation Trigger)
        if (finalScore < threshold) {
            // Check if dynamic override is enabled for the phase and risk is high (e.g., >= 0.8)
            if (phase.dynamic_adjustment && context.risk_score >= 0.8) {
                // Signal external governance loop to trigger mitigation or ruleset change
                return { 
                    decision: false, 
                    finalScore: finalScore,
                    reason: 'Weighted consensus failed below high-risk threshold. Mitigation required.' 
                }; 
            }
        }

        return { 
            decision: finalScore >= threshold, 
            finalScore: finalScore 
        };
    }
    
    /**
     * Placeholder for future ruleset types.
     */
    _evaluateMetricCompliance(phase, context, proposalScoreMap) {
        return { decision: false, reason: 'Metric compliance ruleset type not yet implemented.' };
    }

    /**
     * Main entry point for proposal evaluation.
     * @param {Object} context - Current system and operational state.
     * @param {Object<string, number>} proposalScoreMap - Actor scores for the proposal.
     * @returns {{decision: boolean, finalScore?: number, reason: string}}
     */
    evaluateProposal(context, proposalScoreMap) {
        const phase = this.getCurrentPhase(context);
        const rulesetId = phase.ruleset_id;
        const ruleset = this.rulesets[rulesetId];

        if (!ruleset) {
            return { decision: false, reason: `Ruleset '${rulesetId}' not found or improperly configured.` };
        }
        
        switch (ruleset.type) {
            case 'weighted_consensus':
                return this._evaluateWeightedConsensus(phase, context, proposalScoreMap);
                
            case 'metric_compliance':
                return this._evaluateMetricCompliance(phase, context, proposalScoreMap);
                
            // case 'absolute_veto':

            default:
                return { decision: false, reason: `Unknown ruleset type: ${ruleset.type}` };
        }
    }
}

module.exports = PolicyEngine;