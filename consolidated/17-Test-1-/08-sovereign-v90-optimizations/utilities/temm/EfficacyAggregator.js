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
    #weights;
    #weightSum;
    #keyMap;

    /**
     * @param {Object} policyConfig - Configuration object containing temm_efficacy_weights.
     * @throws {Error} If weights are missing, invalid, or sum to a non-positive value.
     */
    constructor(policyConfig) {
        this.#keyMap = EFFICACY_KEYS.map(key => ({
            scoreKey: `${key}_score`,
            weightKey: `${WEIGHT_PREFIX}${key}`
        }));
        
        this.#parseAndValidateWeights(policyConfig.temm_efficacy_weights ?? {});
    }

    /**
     * Parses, validates, and initializes the weights.
     * @param {Object} rawWeights - The raw weights object from policy configuration.
     * @private
     * @throws {Error} If weights are missing, invalid, or sum to a non-positive value.
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
     * @throws {RangeError} If any score is not a number within [0.0, 1.0].
     */
    calculate(vectors) {
        const weightedSum = this.#keyMap.reduce((acc, map) => {
            const score = vectors[map.scoreKey];
            const weight = this.#weights[map.weightKey];

            if (typeof score !== 'number' || score < 0.0 || score > 1.0) {
                throw new RangeError(`Efficacy vector score input for '${map.scoreKey}' must be a number within [0.0, 1.0]. Received: ${score}`);
            }

            return acc + (score * weight);
        }, 0);

        const deltaPsi = weightedSum / this.#weightSum;
        
        return Math.max(0.0, Math.min(1.0, deltaPsi));
    }
}

module.exports = EfficacyAggregator;
