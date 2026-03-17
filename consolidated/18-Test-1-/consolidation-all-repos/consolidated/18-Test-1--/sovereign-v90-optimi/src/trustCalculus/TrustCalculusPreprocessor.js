/**
 * Trust Calculus Preprocessor Service
 * Implements the normalization and initial weighting logic defined in the 
 * GOVERNANCE CONFIGURATIONS to convert raw RMS metrics into standardized
 * Trust Score components.
 */
import { METRIC_CONFIGURATIONS } from '../governance/retirementMetricWeights.js';

// Assume AGI-KERNEL provides plugin interface for metric calculation.
declare const AGI: {
    plugins: {
        MetricContributionCalculator: {
            execute: (args: { rawValue: number, config: any, historicalContext?: any }) => number;
        }
    }
}

/**
 * Processes a bundle of raw metrics into weighted Trust Score contributions.
 * @param {Object<string, number>} rawMetrics - Map of metric names to raw values.
 * @returns {Object<string, number>} Map of metric names to their weighted contributions.
 */
export function calculateTrustContributions(rawMetrics: Record<string, number>): Record<string, number> {
    const contributions: Record<string, number> = {};

    // Robustness check: Ensure the required AGI plugin is available.
    if (!AGI || !AGI.plugins || !AGI.plugins.MetricContributionCalculator || typeof AGI.plugins.MetricContributionCalculator.execute !== 'function') {
        console.error("AGI MetricContributionCalculator plugin is unavailable or improperly configured. Cannot calculate trust contributions.");
        return contributions;
    }

    const calculator = AGI.plugins.MetricContributionCalculator;

    for (const [metricName, config] of Object.entries(METRIC_CONFIGURATIONS)) {
        const rawValue = rawMetrics[metricName];

        // Input Validation: Ensure rawValue is a finite number before processing.
        if (typeof rawValue !== 'number' || !isFinite(rawValue)) {
            console.warn(`Raw metric ${metricName} missing or invalid (${rawValue}). Skipping calculation.`);
            continue;
        }

        try {
            // Delegate normalization, weighting, and influence application to the dedicated utility plugin.
            const contribution = calculator.execute({
                rawValue,
                config,
                // historicalContext might be required for 'percentile_rank' strategy
                historicalContext: undefined 
            });
            
            // Output Validation: Ensure the result is a valid number.
            if (typeof contribution === 'number' && isFinite(contribution)) {
                contributions[metricName] = contribution;
            } else {
                console.warn(`Plugin returned invalid contribution for ${metricName}: ${contribution}. Setting to 0.`);
                contributions[metricName] = 0;
            }
            
        } catch (error) {
            console.error(`Error calculating contribution for ${metricName}:`, error);
            contributions[metricName] = 0;
        }
    }

    return contributions;
}

// Example export for utility
export default { calculateTrustContributions };