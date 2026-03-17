import { TRUST_METRICS_SCHEMA, TRUST_POLARITY } from '../config/trustCalculusSchema';

/**
 * CoreTrustCalculator
 * Utilizes the immutable TRUST_METRICS_SCHEMA to convert raw component metrics
 * into a single normalized Trust Score (0.0 to 1.0).
 */
export class CoreTrustCalculator {
    
    /**
     * Calculates the normalized Trust Score.
     * @param {Object<string, number>} rawMetrics - Input metrics (0.0 to 1.0) for redundancyScore, usageRate, etc.
     * @returns {number} The final normalized Trust Score (0.0 to 1.0).
     * @throws {Error} If a required metric is missing or outside the expected [0, 1] range.
     */
    static calculateScore(rawMetrics) {
        let totalScore = 0;
        
        for (const [metricName, { weight, polarity }] of Object.entries(TRUST_METRICS_SCHEMA)) {
            const rawValue = rawMetrics[metricName];
            
            if (rawValue === undefined || typeof rawValue !== 'number' || rawValue < 0 || rawValue > 1) {
                // The calculator strictly requires normalized [0, 1] inputs for all defined metrics.
                throw new Error(
                    `[CoreTrustCalculator] Required metric '${metricName}' is missing or outside bounds [0, 1].`
                );
            }

            let normalizedValue = rawValue;

            // Apply polarity correction if Inverse Correlation is required
            if (polarity === TRUST_POLARITY.NEGATIVE) {
                // Invert the score (1 - rawValue) so that higher input maps to lower trust contribution.
                normalizedValue = 1.0 - rawValue;
            }

            // Apply weight to the (potentially inverted) normalized score
            totalScore += normalizedValue * weight;
        }

        // The result is already normalized between 0 and 1 due to the schema design (weights summing to 1.0)
        return totalScore;
    }
}