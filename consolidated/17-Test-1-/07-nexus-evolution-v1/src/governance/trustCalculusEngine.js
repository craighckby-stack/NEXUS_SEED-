/**
 * Trust Calculus Engine (TCE) - src/governance/trustCalculusEngine.js
 * ID: TCE v94.2 (Refactored for generalization and explicit transformation logic)
 * Role: Configurable Decision Scoring / Weighted Metric Aggregation
 *
 * TCE provides configurable, weighted decision scoring. Models explicitly define 
 * metric transformation types ('PROFIT' or 'RISK') to standardize scoring inputs 
 * before weight application, improving transparency and extensibility.
 */

class TrustCalculusEngine {
    /**
     * @param {object} [config={}] - Initial configuration. Ideally, loaded dynamically via init().
     */
    constructor(config = {}) {
        // Default internal models (used if external configuration fails or hasn't loaded)
        this.models = config.models || {
            'RETIREMENT_CALCULUS': {
                metrics: {
                    // Metric 1: Higher redundancy score is beneficial (PROFIT)
                    redundancyScore: { weight: 0.4, type: 'PROFIT' }, 
                    // Metric 2: Higher complexity reduction is beneficial (PROFIT)
                    complexityReductionEstimate: { weight: 0.3, type: 'PROFIT' },
                    // Metric 3: Higher dependency exposure is risky (RISK). Automatically inverted during calculation.
                    criticalDependencyExposure: { weight: 0.3, type: 'RISK' } 
                }
            }
        };
    }

    /**
     * Initializes the engine, optionally loading dynamic weights or external configurations.
     * Typically called with configuration data loaded from TrustModelConfigurationStore.
     * @param {object} configData - Configuration data containing governance model definitions.
     */
    async init(configData) {
        if (configData && configData.models) {
            // Merge or overwrite internal models based on external configuration
            Object.assign(this.models, configData.models);
        }
        console.log(`[TCE v94.2] Initialized with ${Object.keys(this.models).length} governance models.`);
    }

    /**
     * Helper to transform a raw metric value based on its defined type.
     * RISK metrics are inverted (1.0 - value) to become a "safety/benefit" factor.
     * @param {number} value - The raw metric value (assumed 0.0 to 1.0).
     * @param {'PROFIT' | 'RISK'} type - The transformation type.
     * @returns {number} The transformed score factor (0.0 to 1.0).
     */
    _transformMetric(value, type) {
        // Ensure value is numeric and clamped
        const clampedValue = Math.min(1.0, Math.max(0.0, value || 0.0));

        switch (type) {
            case 'RISK':
                // Invert the risk factor to represent safety/benefit factor
                return 1.0 - clampedValue; 
            case 'PROFIT':
            default:
                return clampedValue;
        }
    }

    /**
     * Calculates a composite score based on defined weights, explicit metric transformation,
     * and input metrics for a specific governance model.
     * 
     * @param {string} modelId - The specific model to use (e.g., 'RETIREMENT_CALCULUS').
     * @param {object} metricData - Input metrics (key/value pairs, assumed 0.0 to 1.0 range).
     * @returns {Promise<number>} The calculated normalized score (0.0 to 1.0).
     */
    async calculateScore(modelId, metricData) {
        const model = this.models[modelId];
        if (!model || !model.metrics) {
            throw new Error(`TCE Error: Trust Calculus Model '${modelId}' not configured or missing metric definitions.`);
        }
        
        let weightedScore = 0;
        let totalWeight = 0; // Needed for normalization if weights don't sum to 1.0 or metrics are missing

        for (const metricKey in model.metrics) {
            const definition = model.metrics[metricKey];
            const rawValue = metricData[metricKey];
            
            if (rawValue === undefined) {
                console.warn(`[TCE] Metric data missing for '${metricKey}' in model '${modelId}'. Assuming 0.`);
                continue;
            }
            
            const transformedFactor = this._transformMetric(rawValue, definition.type);
            
            weightedScore += (transformedFactor * definition.weight);
            totalWeight += definition.weight; // Only count weights for metrics that were available
        }

        if (totalWeight === 0) {
             // This should typically be caught during configuration load, but acts as a safeguard.
             throw new Error(`TCE Error: Model '${modelId}' has zero effective total weight.`);
        }

        // Normalize the score to ensure it is bounded by 0.0 to 1.0.
        const normalizedScore = weightedScore / totalWeight;

        return Math.min(1.0, Math.max(0.0, normalizedScore));
    }
}

export const trustCalculusEngine = new TrustCalculusEngine();
// Export the class to allow dependency injection or advanced external configuration loading setup
export { TrustCalculusEngine };