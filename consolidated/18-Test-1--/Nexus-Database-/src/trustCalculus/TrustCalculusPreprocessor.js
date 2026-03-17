/**
 * Trust Calculus Preprocessor Service
 * Implements the normalization and initial weighting logic defined in the 
 * GOVERNANCE CONFIGURATIONS to convert raw RMS metrics into standardized
 * Trust Score components.
 */
import { METRIC_CONFIGURATIONS } from '../governance/retirementMetricWeights.js';

// Placeholder utility functions for complex normalization strategies
const Normalizers = {
    /** Scales input Rv linearly between 0 and 1 based on defined bounds. */
    linear_minmax: (Rv, min, max) => (Rv - min) / (max - min),
    
    /** Applies a logarithmic transform to handle high-variance risk metrics. */
    logarithmic: (Rv) => Math.log1p(Rv) / Math.log1p(1000), // Example scaling divisor

    /** Requires historical context (not implemented here) to determine rank/percentile. */
    percentile_rank: (Rv, historicalContext) => { 
        // In a production system, this would query historical data.
        // Placeholder returns 0.5 if not found, or throws error if necessary context is absent.
        console.warn(`Percentile normalization requested for ${Rv}. Context missing.`);
        return 0.5; 
    }
};

/**
 * Processes a bundle of raw metrics into weighted Trust Score contributions.
 * @param {Object<string, number>} rawMetrics - Map of metric names to raw values.
 * @returns {Object<string, number>} Map of metric names to their weighted contributions.
 */
export function calculateTrustContributions(rawMetrics) {
    const contributions = {};

    for (const [metricName, config] of Object.entries(METRIC_CONFIGURATIONS)) {
        const rawValue = rawMetrics[metricName];

        if (rawValue === undefined || rawValue === null) {
            console.warn(`Raw metric ${metricName} missing. Skipping calculation.`);
            continue;
        }

        const { weight, influence, normalization } = config;
        let normalizedValue;

        // 1. Normalization Step
        const normalizeFn = Normalizers[normalization.strategy];
        if (normalizeFn) {
            const [min = 0, max = 1] = normalization.bounds || [0, 1];
            normalizedValue = normalizeFn(rawValue, min, max);
        } else {
            console.error(`Unknown normalization strategy: ${normalization.strategy}`);
            normalizedValue = 0;
        }

        // Ensure the normalized value is clipped to [0, 1] for stable calculus
        normalizedValue = Math.min(1, Math.max(0, normalizedValue));

        // 2. Weighting and Influence Application Step
        const direction = influence === 'negative' ? -1 : 1;
        const contribution = normalizedValue * weight * direction;
        
        contributions[metricName] = contribution;
    }

    return contributions;
}

// Example export for utility
export default { calculateTrustContributions };
