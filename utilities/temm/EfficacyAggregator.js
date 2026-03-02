// utilities/temm/EfficacyAggregator.js
/**
 * EfficacyAggregator: Calculates the mandatory Transition Efficacy & Metric Measure (\Delta\Psi)
 * based on the weighted arithmetic mean, ensuring normalization constraints [0.0, 1.0].
 */

const EFFICACY_KEYS = ['GHS', 'RES', 'SRS'];
const WEIGHT_PREFIX = 'W_';

class EfficacyAggregator {
    /**
     * @param {Object} policyConfig - Configuration object containing temm_efficacy_weights.
     */
    constructor(policyConfig) {
        this.weights = policyConfig.temm_efficacy_weights || {};
        
        this.weightSum = 0;

        // 1. Mandatory Weight Existence and Summation Check
        for (const key of EFFICACY_KEYS) {
            const weightKey = WEIGHT_PREFIX + key;
            const weight = this.weights[weightKey];

            if (typeof weight !== 'number' || weight <= 0) {
                throw new Error(`TEMM Policy Weights missing or invalid mandatory weight: ${weightKey}. Must be positive number.`);
            }
            this.weightSum += weight;
        }

        // 2. Final Sum Check
        if (this.weightSum <= 0) {
            // Should theoretically be caught by loop above, but kept for robustness
            throw new Error("TEMM Policy Weights must sum to a positive value.");
        }
    }

    /**
     * Calculates the TEMM scalar (\Delta\Psi).
     * @param {Object} vectors - Must contain GHS_score, RES_score, SRS_score, all in [0.0, 1.0].
     * @returns {number} The normalized TEMM score \Delta\Psi \in [0.0, 1.0].
     */
    calculate(vectors) {
        let weightedSum = 0;

        for (const key of EFFICACY_KEYS) {
            const vectorKey = `${key}_score`;
            const weightKey = WEIGHT_PREFIX + key;
            
            const score = vectors[vectorKey];
            const weight = this.weights[weightKey];

            // Enforcement of [0.0, 1.0] input constraint (Critical Safety Measure)
            if (typeof score !== 'number' || score < 0.0 || score > 1.0) {
                throw new RangeError(`Efficacy vector score input for '${vectorKey}' must be a number within [0.0, 1.0]. Received: ${score}`);
            }

            // V_ID * W_ID
            weightedSum += score * weight;
        }

        // Normalization: Division by Sum(W_ID)
        const deltaPsi = weightedSum / this.weightSum;
        
        // Guaranteed Constraint Adherence (Clamping)
        return Math.max(0.0, Math.min(1.0, deltaPsi)); 
    }
}

module.exports = EfficacyAggregator;