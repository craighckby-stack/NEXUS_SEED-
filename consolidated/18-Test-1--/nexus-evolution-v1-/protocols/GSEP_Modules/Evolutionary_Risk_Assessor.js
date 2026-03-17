/**
 * EvolutionaryRiskAssessorKernel.js
 *
 * Encapsulated service kernel to analyze proposed code evolutions against GPC risk profiles.
 * Enforces architectural consistency by isolating dependencies and I/O.
 *
 * Dependencies: GSEP_Config/ConfigLoader, Global plugins (QuantitativeEvolutionScorer, EvolutionPolicyEnforcer)
 */

import { loadConfig } from '../GSEP_Config/ConfigLoader';

// NOTE: Global plugin declarations are replaced by runtime checks in #setupDependencies

class EvolutionaryRiskAssessorKernel {
    #gpcConfig;
    #riskTolerance;
    #targetEfficiencyGainMin;
    #scorerConfig;

    #quantitativeScorerTool;
    #policyEnforcerTool;

    /**
     * Initializes the kernel, loading configuration and resolving mandatory tools.
     */
    constructor() {
        this.#setupDependencies();
    }

    /**
     * Goal: Synchronous Setup Extraction.
     * Extracts all synchronous dependency resolution, configuration loading, 
     * and tool validation into a single private setup phase.
     */
    #setupDependencies() {
        // 1. Load GPC Configuration
        this.#gpcConfig = this.#loadGPCConfig();

        const evolutionControl = this.#gpcConfig.protocol_evolution_control;

        if (!evolutionControl || evolutionControl.risk_tolerance === undefined || evolutionControl.target_efficiency_gain_min === undefined) {
            this.#throwSetupError('Missing critical configuration fields in GPC.protocol_evolution_control.');
        }

        this.#riskTolerance = evolutionControl.risk_tolerance;
        this.#targetEfficiencyGainMin = evolutionControl.target_efficiency_gain_min;

        // 2. Define Scorer Configuration (Internal, frozen for immutability)
        this.#scorerConfig = Object.freeze({
            complexityThreshold: 50,
            instabilityThreshold: 0.01,
            efficacyWeight: 0.6,
            complexityRiskWeight: 0.8,
            instabilityRiskWeight: 0.5
        });

        // 3. Resolve External Tools (Checking global scope based on architectural standard)
        this.#quantitativeScorerTool = globalThis.QuantitativeEvolutionScorer;
        this.#policyEnforcerTool = globalThis.EvolutionPolicyEnforcer;

        if (!this.#quantitativeScorerTool || typeof this.#quantitativeScorerTool.execute !== 'function') {
            this.#throwSetupError('Required dependency QuantitativeEvolutionScorer not found or invalid.');
        }
        if (!this.#policyEnforcerTool || typeof this.#policyEnforcerTool.determineRecommendation !== 'function') {
            this.#throwSetupError('Required dependency EvolutionPolicyEnforcer not found or invalid.');
        }
    }

    /**
     * Goal: I/O Proxy Creation (Error Handling).
     * Handles fatal setup errors.
     */
    #throwSetupError(message, innerError = null) {
        const error = new Error(`[EvolutionaryRiskAssessorKernel Setup Error]: ${message}`);
        error.cause = innerError;
        throw error;
    }
    
    /**
     * Goal: I/O Proxy Creation (Config Load).
     * Handles external config loading operation.
     */
    #loadGPCConfig() {
        try {
            return loadConfig('GPC');
        } catch (e) {
            this.#throwSetupError('Failed to load GPC configuration.', e);
        }
    }

    /**
     * Goal: I/O Proxy Creation (Tool Delegation).
     * Delegates execution to the Quantitative Scorer plugin.
     */
    #delegateToQuantitativeScorer(metrics, config) {
        return this.#quantitativeScorerTool.execute(metrics, config);
    }

    /**
     * Goal: I/O Proxy Creation (Tool Delegation).
     * Delegates policy enforcement to the dedicated plugin, injecting required configuration.
     */
    #delegateToPolicyEnforcement(quantitativeRisk, estimatedImpact) {
        return this.#policyEnforcerTool.determineRecommendation(
            quantitativeRisk,
            this.#riskTolerance, // Injected configuration
            estimatedImpact,
            this.#targetEfficiencyGainMin // Injected configuration
        );
    }

    /**
     * Calculates the risk and predicted efficacy of a proposed code change object.
     * @param {object} proposal - The proposed refactoring/scaffolding object.
     * @param {object} currentMetrics - Real-time system performance metrics.
     * @returns {object} - Assessment score and recommendation.
     */
    assessProposal(proposal, currentMetrics) {
        // 1. Prepare metrics for quantitative scoring
        const metrics = {
            estimatedImpact: proposal.metrics.predicted_cpu_reduction,
            codeComplexityChange: proposal.metrics.cyclomatic_change,
            recent_errors: currentMetrics.recent_errors
        };

        // 2. Execute quantitative scoring (via proxy)
        const scoringResult = this.#delegateToQuantitativeScorer(metrics, this.#scorerConfig);
        const quantitativeRisk = scoringResult.quantitativeRisk;
        const estimatedImpact = metrics.estimatedImpact;

        // 3. Policy Enforcement (via proxy)
        const recommendation = this.#delegateToPolicyEnforcement(
            quantitativeRisk,
            estimatedImpact
        );

        return {
            risk: quantitativeRisk,
            gain_metric: estimatedImpact,
            recommendation: recommendation,
            reasoning: `Risk tolerance: ${this.#riskTolerance}. Calculated risk: ${quantitativeRisk.toFixed(2)}.`
        };
    }
}

export { EvolutionaryRiskAssessorKernel };