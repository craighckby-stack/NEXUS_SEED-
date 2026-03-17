import { TRUST_METRICS_SCHEMA, TRUST_POLARITY } from '../config/trustCalculusSchema.js';

/**
 * Calculates the final Trust Score (0.0 to 1.0) based on input metric values 
 * and the predefined weighting schema.
 * 
 * It handles polarity adjustment for negatively correlated metrics (Metric -> 1 - Metric).
 * 
 * @param {Object<string, number>} metrics An object mapping metric name to its 0-1 normalized value.
 * @returns {number} The final Trust Score (0.0 to 1.0).
 */
export function calculateTrustScore(metrics) {
    const schemaEntries = Object.entries(TRUST_METRICS_SCHEMA);
    
    if (schemaEntries.length === 0) {
        console.warn('Trust calculus schema is empty. Returning 0.');
        return 0;
    }

    const totalScore = schemaEntries.reduce((acc, [metricName, definition]) => {
        const rawValue = metrics[metricName];

        if (typeof rawValue !== 'number' || rawValue < 0 || rawValue > 1) {
            // Robust check: Input metrics must be pre-normalized 0-1 scores.
            throw new Error(`[TrustCalc Error] Missing or invalid 0-1 score provided for metric: ${metricName}. Value: ${rawValue}`);
        }

        // Apply polarity adjustment if required
        const adjustedValue = 
            definition.polarity === TRUST_POLARITY.NEGATIVE
                ? 1.0 - rawValue 
                : rawValue;
        
        // Weighted summation
        return acc + (adjustedValue * definition.weight);
    }, 0);

    // Due to floating point math, ensure the result is clamped to [0, 1]
    return Math.max(0, Math.min(1, totalScore));
}