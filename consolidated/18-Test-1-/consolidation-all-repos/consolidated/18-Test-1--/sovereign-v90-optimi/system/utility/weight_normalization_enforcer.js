// FILE: system/utility/weight_normalization_enforcer.js

/**
 * Utility class to enforce the normalization constraint (W1+W2+W3 = 1.0) using the dedicated tool.
 * JSON schema cannot perform arithmetic across properties, requiring runtime validation
 * for functional correctness in the TEMM composite score calculation.
 */

// Assuming environment access to plugins via the global runtime or dependency injection
declare const WeightNormalizationEnforcerTool: {
    execute(args: { config: any, keys: string[], weights?: number[], epsilon?: number }): { success: boolean, sum: number, error?: string };
};

const EPSILON = 0.0001; // Tolerance for floating point summation

class WeightNormalizationEnforcer {
    /**
     * Enforces normalization on TEMM configuration weights.
     * @param {object} temmConfig - Configuration object containing weights.
     * @returns {boolean} True if normalization passes.
     * @throws {Error} If normalization fails.
     */
    static enforce(temmConfig: { GHS_weight?: number, RES_weight?: number, SRS_weight?: number }): boolean {
        
        const KEYS_TO_CHECK = ['GHS_weight', 'RES_weight', 'SRS_weight'];

        // Use the dedicated external tool for robust validation
        const result = WeightNormalizationEnforcerTool.execute({
            config: temmConfig,
            keys: KEYS_TO_CHECK,
            epsilon: EPSILON
        });

        if (!result.success) {
            // Re-throw the tool's error or a standardized error
            throw new Error(result.error || `Configuration Error: TEMM weights must sum to 1.0 for score normalization. Found sum: ${result.sum.toFixed(4)}.`);
        }

        // All individual weights must also pass schema validation (0.0 <= W <= 1.0)
        // This check complements, but does not replace, standard schema validation.

        return true; 
    }
}

module.exports = WeightNormalizationEnforcer;