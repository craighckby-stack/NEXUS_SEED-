import { TRUST_METRICS_SCHEMA, TRUST_POLARITY } from '../config/trustCalculusSchema.js';

/**
 * Conceptual interface for the PolarizedWeightedScorer plugin.
 * In a real environment, this dependency would be injected or imported.
 */
const polarizedWeightedScorer = {
    // Implementation detail: assumes a standard execute method as defined in the plugin below.
    execute: (args) => { throw new Error("Plugin not initialized"); }
};

// NOTE: In a managed environment, the AGI-KERNEL ensures proper tool instantiation.

/**
 * Calculates the final Trust Score (0.0 to 1.0) based on input metric values 
 * and the predefined weighting schema using the Polarized Weighted Scorer utility.
 * 
 * @param {Object<string, number>} metrics An object mapping metric name to its 0-1 normalized value.
 * @returns {number} The final Trust Score (0.0 to 1.0).
 */
export function calculateTrustScore(metrics: { [key: string]: number }): number {
    if (Object.keys(TRUST_METRICS_SCHEMA).length === 0) {
        console.warn('Trust calculus schema is empty. Returning 0.');
        return 0;
    }

    try {
        // Delegate calculation, validation, and clamping to the reusable utility
        return polarizedWeightedScorer.execute({
            metrics, // Use object literal shorthand
            schema: TRUST_METRICS_SCHEMA,
            negativePolarityMarker: TRUST_POLARITY.NEGATIVE
        });
    } catch (e) {
        // Re-throw with improved context. The previous message erroneously assumed only 'input validation' failed.
        throw new Error(`Trust score calculation failed using PolarizedWeightedScorer: ${e.message}`);
    }
}