// utilities/temm/EfficacyAggregator.js
/**
 * EfficacyAggregator: Calculates the mandatory Transition Efficacy & Metric Measure (\Delta\Psi)
 * based on the weighted arithmetic mean, ensuring normalization constraints [0.0, 1.0].
 * 
 * Refactored using private class fields for improved encapsulation and structured initialization.
 */

const EFFICACY_KEYS = ['GHS', 'RES', 'SRS'];
const WEIGHT_PREFIX = 'W_';

class EfficacyAggregator {
    #weights;     // { W_GHS: 0.5, ... }
    #weightSum;   // Total sum of all weights
    #keyMap;      // Pre-calculated mapping of score keys to weight keys

    /**
     * @param {Object} policyConfig - Configuration object containing temm_efficacy_weights.
     */
    constructor(policyConfig) {
        // 1. Initialize mandatory key mapping structure once
        this.#keyMap = EFFICACY_KEYS.map(key => ({
            scoreKey: `${key}_score`,
            weightKey: WEIGHT_PREFIX + key
        }));
        
        // 2. Validate and initialize weights
        this.#parseAndValidateWeights(policyConfig.temm_efficacy_weights || {});
    }

    /**
     * Private method to handle robust weight parsing, validation, and summation.
     * @param {Object} rawWeights 
     * @private
     */
    #parseAndValidateWeights(rawWeights) {
        let calculatedSum = 0;
        const validatedWeights = {};

        for (const map of this.#keyMap) {
            const weight = rawWeights[map.weightKey];

            if (typeof weight !== 'number' || weight <= 0) {
                throw new Error(`TEMM Policy Weights missing or invalid mandatory weight: ${map.weightKey}. Must be positive number (> 0).`);
            }
            
            validatedWeights[map.weightKey] = weight;
            calculatedSum += weight;
        }

        if (calculatedSum <= 0) {
            throw new Error("TEMM Policy Weights must sum to a positive value.");
        }

        this.#weights = validatedWeights;
        this.#weightSum = calculatedSum;
    }

    /**
     * Calculates the TEMM scalar (\Delta\Psi) using the weighted arithmetic mean.
     * @param {Object} vectors - Must contain GHS_score, RES_score, SRS_score, all in [0.0, 1.0].
     * @returns {number} The normalized TEMM score \Delta\Psi \in [0.0, 1.0].
     */
    calculate(vectors) {
        
        // Use reduce for cleaner calculation and dependency on the pre-built key map.
        const weightedSum = this.#keyMap.reduce((acc, map) => {
            const score = vectors[map.scoreKey];
            const weight = this.#weights[map.weightKey];

            // Critical Safety Measure: Input Constraint Check [0.0, 1.0]
            if (typeof score !== 'number' || score < 0.0 || score > 1.0) {
                throw new RangeError(`Efficacy vector score input for '${map.scoreKey}' must be a number within [0.0, 1.0]. Received: ${score}`);
            }

            return acc + (score * weight);
        }, 0);

        // Normalization: Division by Sum(W_ID)
        const deltaPsi = weightedSum / this.#weightSum;
        
        // Guaranteed Constraint Adherence (Clamping)
        return Math.max(0.0, Math.min(1.0, deltaPsi)); 
    }
}

module.exports = EfficacyAggregator;