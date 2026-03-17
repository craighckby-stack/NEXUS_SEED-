/**
 * Module: DynamicToleranceAdapter (DTA)
 * Responsibility: Calculates and proposes dynamic adjustments (DAF - Dynamic Adaptation Factors)
 * to the GTCM baseline tolerance margins based on real-time operational volatility and system health vectors.
 *
 * Inputs: System/VulnerabilitySensorData, Performance/EfficacyFeedbackLoop, Risk/VectorFusionScores
 * Outputs: DAF Configuration Update Object
 */

/**
 * @interface IDynamicFactorHeuristicDeriver
 * Defined in plugin: DynamicFactorHeuristicDeriver
 */

class DynamicToleranceAdapter {
    #config: any;
    #dfhdTool: any; // IDynamicFactorHeuristicDeriver

    /**
     * @param gtcm_config The governance configuration including baseline margins.
     * @param toolKit Contains the DynamicFactorHeuristicDeriver plugin.
     */
    constructor(gtcm_config: any, toolKit: { DynamicFactorHeuristicDeriver: any }) {
        this.#setupDependencies(gtcm_config, toolKit);
    }

    /**
     * Handles synchronous setup, dependency resolution, and mandatory checks.
     */
    #setupDependencies(gtcm_config, toolKit) {
        if (!toolKit || !toolKit.DynamicFactorHeuristicDeriver) {
            this.#throwSetupError("Missing mandatory dependency: DynamicFactorHeuristicDeriver.");
        }
        this.#config = gtcm_config;
        this.#dfhdTool = toolKit.DynamicFactorHeuristicDeriver;
    }

    /**
     * I/O Proxy: Throws a fatal setup error.
     */
    #throwSetupError(message) {
        throw new Error(`[DTA Setup] ${message}`);
    }

    /**
     * I/O Proxy: Logs a warning when policy configuration is missing.
     */
    #logMissingConfigWarning(metric_key) {
        console.warn(`DTA: Metric key ${metric_key} missing policy configuration.`);
    }

    /**
     * I/O Proxy: Logs a warning when the baseline margin is invalid.
     */
    #logInvalidMarginWarning(metric_key, margin) {
        console.warn(`DTA: Metric ${metric_key} has invalid baseline tolerance margin: ${margin}.`);
    }

    /**
     * I/O Proxy: Logs a warning when no gates are defined in the config.
     */
    #logNoGatesWarning() {
        console.warn("DTA: No governance gates defined in configuration for adaptation proposal.");
    }

    /**
     * I/O Proxy: Delegates execution to the external heuristic calculation tool.
     */
    #delegateToHeuristicCalculation(current_margin, volatility_index, adjustmentParams) {
        return this.#dfhdTool.calculate(
            current_margin,
            volatility_index,
            adjustmentParams
        );
    }

    /**
     * Calculates the dynamic adaptation factor and proposes a new tolerance margin.
     * @param metric_key The key identifying the governance metric.
     * @param sensor_data Sensor data providing dynamic input metrics (like volatility).
     * @returns Proposed margin adjustment object.
     */
    calculateDynamicFactor(metric_key: string, sensor_data: Map<string, number>): object {
        // Retrieve full configuration for the specific gate
        const gateConfig = this.#config.governance_gates?.[metric_key];
        const policyConfig = gateConfig?.policy;

        if (!policyConfig) {
            this.#logMissingConfigWarning(metric_key);
            return { metric_key, proposed_margin: null, adjustment_factor: 1.0, adaptation_reason: "Configuration missing" };
        }

        const current_margin = policyConfig.baseline_tolerance_margin;

        // Retrieve dynamic input (currently hardcoded to system volatility)
        const volatility_index = sensor_data.get('system_volatility') || 0;

        // Define specific parameters for this adjustment heuristic, prioritizing configuration values.
        const adjustmentParams = policyConfig.dynamic_factors?.heuristic_params || {
            indexWeight: 0.1,
            baseFactor: 1.0
        };

        // Ensure the current margin is valid before passing to the tool
        if (typeof current_margin !== 'number' || isNaN(current_margin)) {
             this.#logInvalidMarginWarning(metric_key, current_margin);
             return { metric_key, proposed_margin: null, adjustment_factor: 1.0, adaptation_reason: "Invalid baseline margin" };
        }

        const calculationResult = this.#delegateToHeuristicCalculation(
            current_margin,
            volatility_index,
            adjustmentParams
        );

        // Proposal based on system context
        return {
            'metric_key': metric_key,
            'proposed_margin': calculationResult.proposedValue,
            'adjustment_factor': calculationResult.adjustmentFactor,
            'adaptation_reason': `Adjusted by DTA due to volatility index ${volatility_index.toFixed(3)} (Factor: ${calculationResult.adjustmentFactor.toFixed(3)})`
        };
    }

    /**
     * Generates a comprehensive proposal by calculating dynamic factors for all configured governance gates.
     * @param system_state Current sensor state map.
     * @returns Adaptation proposal containing a list of adjustments.
     */
    generateAdaptationProposal(system_state: Map<string, number>): object {
        const proposals = [];
        const governance_gates = this.#config.governance_gates || {};

        // Strategic Improvement: Iterate over all configured governance gates for full coverage.
        const gateKeys = Object.keys(governance_gates);

        if (gateKeys.length === 0) {
            this.#logNoGatesWarning();
        }

        for (const metric_key of gateKeys) {
            const adjustment = this.calculateDynamicFactor(metric_key, system_state);

            // Only include proposals that resulted in a successful margin calculation
            if (adjustment.proposed_margin !== null) {
                proposals.push(adjustment);
            }
        }

        return {
            'adaptation_id': `DTA_PROP_${Date.now()}`,
            'proposals': proposals
        };
    }
}
module.exports = DynamicToleranceAdapter;