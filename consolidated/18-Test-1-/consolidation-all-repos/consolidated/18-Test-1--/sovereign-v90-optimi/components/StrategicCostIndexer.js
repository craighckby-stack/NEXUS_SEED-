/**
 * AGI-KERNEL Strategic Cost Indexer (SCI)
 * Optimizes cost indexing by applying strategic weights and dynamic runtime factors.
 */
class StrategicCostIndexer {

    /**
     * Utility method for efficient map multiplication (Base Cost * Strategic Weight).
     * Encapsulated as a private static method for strict internal use.
     * @param {Object<string, number>} baseCosts 
     * @param {Object<string, number>} weights 
     * @returns {Object<string, number>} Map of strategically weighted costs.
     */
    static #applyStrategicWeights(baseCosts, weights) {
        const weightedCosts = {};
        const keys = Object.keys(baseCosts);
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const base = baseCosts[key];
            const weight = weights[key] ?? 1.0; 
            
            // Fast path multiplication and type check
            if (typeof base === 'number' && typeof weight === 'number') {
                weightedCosts[key] = base * weight;
            } else {
                // Defensive assignment if types are invalid, assuming base is the fallback
                weightedCosts[key] = base;
            }
        }
        return weightedCosts;
    }

    /**
     * @param {Object<string, number>} baseCosts - Map of raw cost items.
     * @param {Object<string, number>} strategicWeights - Map of strategic importance weights.
     */
    constructor(baseCosts, strategicWeights) {
        if (!baseCosts || typeof baseCosts !== 'object' || !strategicWeights || typeof strategicWeights !== 'object') {
            throw new Error("Base costs and strategic weights must be valid objects for initialization.");
        }
        
        // Structural validation: ensure there is data to process
        if (Object.keys(baseCosts).length === 0) {
            throw new Error("Base costs object must not be empty.");
        }

        this.baseCosts = baseCosts;
        this.strategicWeights = strategicWeights;
    }

    /**
     * Internal synchronous calculation step: Generates the payload by applying strategic weights
     * to the base costs.
     * @returns {Object<string, number>} Map of strategically weighted costs.
     */
    #prepareWeightedPayload() {
        return StrategicCostIndexer.#applyStrategicWeights(
            this.baseCosts, 
            this.strategicWeights
        );
    }

    /**
     * Calculates the Strategic Cost Index.
     * 
     * @param {Object<string, number>} factors - Dynamic runtime adjustment factors.
     * @returns {number} The calculated aggregated strategic cost index.
     */
    calculateIndex(factors = {}) {
        // 1. Prepare the payload by calculating strategically weighted costs (Internal sync calculation).
        const strategicallyWeightedCosts = this.#prepareWeightedPayload();

        // 2. Delegate final factor application and aggregation (External Tool Execution).
        return KERNEL_SYNERGY_CAPABILITIES.CostIndexingTool.execute(
            'calculateFactorAggregation',
            strategicallyWeightedCosts,
            factors
        );
    }
}

export default StrategicCostIndexer;