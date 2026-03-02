// FILE: system/utility/weight_normalization_enforcer.js
/**
 * Utility class to enforce the normalization constraint (W1+W2+W3 = 1.0).
 * JSON schema cannot perform arithmetic across properties, requiring runtime validation
 * for functional correctness in the TEMM composite score calculation.
 */

const EPSILON = 0.0001; // Tolerance for floating point summation

class WeightNormalizationEnforcer {
    static enforce(temmConfig) {
        const GHS = temmConfig.GHS_weight || 0;
        const RES = temmConfig.RES_weight || 0;
        const SRS = temmConfig.SRS_weight || 0;

        const sum = GHS + RES + SRS;

        if (Math.abs(sum - 1.0) > EPSILON) {
            throw new Error(`Configuration Error: TEMM weights must sum to 1.0 for score normalization. Found sum: ${sum.toFixed(4)}.`);
        }

        // All individual weights must also pass schema validation (0.0 <= W <= 1.0)
        // This check complements, but does not replace, standard schema validation.

        return true; 
    }
}

module.exports = WeightNormalizationEnforcer;