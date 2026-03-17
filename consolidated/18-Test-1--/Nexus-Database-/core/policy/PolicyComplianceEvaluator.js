/*
 * Policy Compliance Evaluator (PCE)
 * Objective: Real-time validation of current system state against the Adaptive Policy Matrix (APM).
 * Role: High-frequency operational watchdog, executing AdaptiveDeviationHandling actions.
 * Optimization Note: Configuration initialization is now pre-processed for O(1) weight lookups.
 */

import { APM } from '../config/governance/APM-99.0_CORE.json';
import { SystemActionDispatcher } from '../system/SystemActionDispatcher.js'; // Decouples action execution from evaluation

class PolicyComplianceEvaluator {
    /** @type {Object.<number, number>} Policy Code -> Weight */
    weightMap = {};
    
    /** @type {Array<Object>} */
    reactionThresholds = [];

    /** @type {Object} */
    trustConfig = {};

    constructor() {
        const matrix = APM.AdaptiveDeviationHandling;

        // 1. Optimize Weights: Transform Array into Map/Object for O(1) lookup in high-frequency calculation.
        this.weightMap = matrix.ADH_Policy_Weights.reduce((acc, weight) => {
            acc[weight.Code] = weight.Weight;
            return acc;
        }, {});

        // 2. Initialize Core Policy Configuration
        this.reactionThresholds = matrix.ADH_ReactionMatrix.Thresholds;
        this.trustConfig = APM.TrustDefinitions.T_Adaptive_Thresholds;

        // Dependency check (optional, but good practice)
        if (typeof SystemActionDispatcher === 'undefined') {
             console.error("PCE requires SystemActionDispatcher for compliance enforcement.");
        }
    }

    /**
     * Main evaluation routine to validate operational state against adaptive policies.
     * @param {Object} metrics - Real-time system performance metrics.
     * @param {Object} operationalContext - Contextual metadata (e.g., current mission phase).
     * @returns {boolean} True if a compliance action was dispatched, false otherwise.
     */
    evaluateSystemState(metrics, operationalContext) {
        // A. Primary Trust Policy Check (Fast fail evaluation)
        if (metrics.P99_CommitTime_ms > this.trustConfig.HighLatency.Scale) {
            console.warn(`[PCE Trust Violation] Latency breach: ${metrics.P99_CommitTime_ms}ms.`);
            SystemActionDispatcher.dispatchAction(this.trustConfig.HighLatency.Trigger, { type: 'trust_violation', metrics });
            return true;
        }

        // B. Calculate Composite Deviation Score
        const deviationScore = this.calculateWeightedDeviation(metrics);

        // C. Determine and Execute Reaction
        // Assumes reactionThresholds are sorted by Max_Sigma (descending) in configuration for optimal search efficiency.
        const reaction = this.reactionThresholds.find(t => deviationScore >= t.Max_Sigma);

        if (reaction) {
            console.warn(`[PCE Deviation] Score: ${deviationScore.toFixed(3)}. Policy Mandate: ${reaction.Action}`);
            SystemActionDispatcher.dispatchAction(reaction.Action, { score: deviationScore, metrics, context: operationalContext });
            return true;
        }
        return false;
    }

    /**
     * Calculates the system deviation score based on predefined weighted policies.
     * Uses O(1) lookup via weightMap for critical performance.
     * @param {Object} metrics - System metrics.
     * @returns {number} The calculated deviation score.
     */
    calculateWeightedDeviation(metrics) {
        let score = 0;

        // Policy Code 1: Security Rate
        score += (metrics.securityViolationRate * (this.weightMap[1] || 0)); 
        // Policy Code 2: Efficiency Loss
        score += (metrics.efficiencyLossSigma * (this.weightMap[2] || 0));
        // Add other core metrics here...
        
        return score;
    }

    // executeMandatedAction has been removed and replaced by delegation to SystemActionDispatcher
}

export const PCE = new PolicyComplianceEvaluator();