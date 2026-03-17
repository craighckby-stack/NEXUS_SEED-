import { TRUST_METRICS_SCHEMA } from '../config/trustCalculusSchema';

/**
 * Trust Calculus Service (TC-SERVICE)
 * Implements the P-01 Trust Calculus Score calculation based on the defined schema.
 */
export class TrustCalculusService {

    /**
     * Calculates the final P-01 Trust Calculus Score based on the weighted and polarized schema.
     * Metrics must be normalized (0.0 to 1.0) prior to input.
     * 
     * @param {object} metrics - Key/Value pairs of aggregated RetirementMetricsService outputs.
     * @returns {number} The final P-01 Trust Calculus Score (1.0 = High Trust, Safe to Retire).
     * @throws {Error} If metrics are missing or not normalized.
     */
    static calculateTrustScore(metrics) {
        let weightedSum = 0;

        for (const [metricName, definition] of Object.entries(TRUST_METRICS_SCHEMA)) {
            const metricValue = metrics[metricName];
            const { weight, polarity } = definition; // Destructuring for explicit access
            
            if (typeof metricValue !== 'number' || metricValue < 0 || metricValue > 1) {
                 throw new Error(`[TC-SERVICE] Invalid or missing metric value for '${metricName}'. Received: ${metricValue}. Metrics must be normalized (0.0 - 1.0).`);
            }

            // Apply Polarity Adjustment: If polarity is -1 (Inverse correlation/Risk metric),
            // invert the value (1 - V) to ensure the metric contributes positively to the overall Trust Score.
            const adjustedValue = (polarity === -1)
                ? (1 - metricValue)
                : metricValue;

            weightedSum += adjustedValue * weight;
        }

        // Clamp the final score between 0.0 and 1.0
        return Math.min(1.0, Math.max(0.0, weightedSum));
    }
}