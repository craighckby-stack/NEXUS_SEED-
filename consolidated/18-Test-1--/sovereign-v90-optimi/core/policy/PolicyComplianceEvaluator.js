/*
 * Policy Compliance Evaluator (PCE)
 * Objective: Real-time validation of current system state against the Adaptive Policy Matrix (APM).
 * Role: High-frequency operational watchdog, executing AdaptiveDeviationHandling actions.
 * Optimization Note: Configuration initialization is now pre-processed for O(1) weight lookups.
 */

import { APM } from '../config/governance/APM-99.0_CORE.json';
import { SystemActionDispatcher } from '../system/SystemActionDispatcher.js'; // Decouples action execution from evaluation
// Assuming PolicyDeviationScorer is available via injection or import
// @ts-ignore
import { PolicyDeviationScorer } from '../tools/PolicyDeviationScorer.js'; 
import { ThresholdReactionMatcher } from '../plugins/ThresholdReactionMatcher.js'; 

class PolicyComplianceEvaluator {
    /** @type {Object.<number, number>} Policy Code -> Weight */
    #weightMap;
    
    /** @type {Object} */
    #trustConfig;

    /** @type {PolicyDeviationScorer} */
    #policyScorer;

    /** @type {ThresholdReactionMatcher} */
    #reactionMatcher;

    /** @type {SystemActionDispatcher} */
    #actionDispatcher; // Enforced Dependency Injection

    /** 
     * @type {Readonly<Object.<number, string>>} Maps Policy Code to expected metric key name. 
     */
    #policyMetricMap = Object.freeze({
        1: 'securityViolationRate',
        2: 'efficiencyLossSigma',
    });

    /**
     * @param {SystemActionDispatcher} actionDispatcher - The core dispatcher utility.
     */
    constructor(actionDispatcher) {
        this.#setupDependencies(actionDispatcher);
        this.#initializeConfiguration();
    }

    /**
     * Enforces critical dependency injection and assignment.
     * @param {SystemActionDispatcher} actionDispatcher 
     * @private
     */
    #setupDependencies(actionDispatcher) {
        if (!actionDispatcher) {
             throw new Error("PCE requires SystemActionDispatcher for compliance enforcement.");
        }
        this.#actionDispatcher = actionDispatcher;
    }

    /**
     * Handles synchronous configuration loading, data preparation (freezing),
     * and internal plugin instantiation.
     * @private
     */
    #initializeConfiguration() {
        const matrix = APM.AdaptiveDeviationHandling;

        // 1. Optimize Weights: Transform Array into Map/Object for O(1) lookup.
        const weightMapInstance = matrix.ADH_Policy_Weights.reduce((acc, weight) => {
            acc[weight.Code] = weight.Weight;
            return acc;
        }, {});
        // Enforce immutability
        this.#weightMap = Object.freeze(weightMapInstance);

        // 2. Initialize Core Policy Configuration and enforce immutability
        this.#trustConfig = Object.freeze(APM.TrustDefinitions.T_Adaptive_Thresholds);

        // 3. Initialize deviation scorer plugin
        this.#policyScorer = new PolicyDeviationScorer({
            weightMap: this.#weightMap,
            policyMetricMap: this.#policyMetricMap
        });

        // 4. Initialize reaction matcher plugin
        this.#reactionMatcher = new ThresholdReactionMatcher(matrix.ADH_ReactionMatrix.Thresholds);
    }

    /**
     * Delegates action execution to the SystemActionDispatcher dependency.
     * @param {string} action
     * @param {Object} payload
     * @private
     */
    #delegateToSystemActionDispatcher(action, payload) {
        this.#actionDispatcher.dispatchAction(action, payload);
    }

    /**
     * Delegates score calculation to the PolicyDeviationScorer dependency.
     * @param {Object} metrics
     * @returns {number}
     * @private
     */
    #delegateToPolicyScorer(metrics) {
        return this.#policyScorer.execute({ metrics });
    }

    /**
     * Delegates threshold matching to the ThresholdReactionMatcher dependency.
     * @param {number} score
     * @returns {{Action: string}|null}
     * @private
     */
    #delegateToReactionMatcher(score) {
        return this.#reactionMatcher.match(score);
    }

    /**
     * Main evaluation routine to validate operational state against adaptive policies.
     * @param {Object} metrics - Real-time system performance metrics.
     * @param {Object} operationalContext - Contextual metadata (e.g., current mission phase).
     * @returns {boolean} True if a compliance action was dispatched, false otherwise.
     */
    evaluateSystemState(metrics, operationalContext) {
        // A. Primary Trust Policy Check (Fast fail evaluation)
        if (metrics.P99_CommitTime_ms > this.#trustConfig.HighLatency.Scale) {
            console.warn(`[PCE Trust Violation] Latency breach: ${metrics.P99_CommitTime_ms}ms.`);
            this.#delegateToSystemActionDispatcher(this.#trustConfig.HighLatency.Trigger, { type: 'trust_violation', metrics });
            return true;
        }

        // B. Calculate Composite Deviation Score using the dedicated scorer plugin
        const deviationScore = this.#delegateToPolicyScorer(metrics);

        // C. Determine and Execute Reaction using the abstracted matcher
        const reaction = this.#delegateToReactionMatcher(deviationScore);

        if (reaction) {
            console.warn(`[PCE Deviation] Score: ${deviationScore.toFixed(3)}. Policy Mandate: ${reaction.Action}`);
            this.#delegateToSystemActionDispatcher(reaction.Action, { score: deviationScore, metrics, context: operationalContext });
            return true;
        }
        return false;
    }
}

// Inject the SystemActionDispatcher at instantiation time.
export const PCE = new PolicyComplianceEvaluator(SystemActionDispatcher);