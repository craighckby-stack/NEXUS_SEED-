/**
 * @module RuntimeDashboard
 * @description Utility for real-time aggregation and visualization of core AGI system metrics.
 * Essential for debugging Phase 2 Multi-Agent interaction (AGI-C-05) and validating trust dynamics.
 * This component focuses purely on data aggregation, separating concerns from presentation logic.
 */

import { fetchAtmScores } from '../consensus/atmSystem';
import { getMcraThresholds } from '../consensus/mcraEngine';
import { fetchSystemMetrics } from '../core/metricsAggregator';

/**
 * Wrapper function to safely execute an asynchronous fetcher.
 * Ensures that a single failing metric retrieval does not halt the entire dashboard report generation.
 * 
 * @param {Function} fetcher The async function to call.
 * @param {*} defaultValue The default value to return on error or failure.
 * @returns {Promise<*>} The result or the default value.
 */
const safeFetch = async (fetcher, defaultValue) => {
    try {
        return await fetcher();
    } catch (error) {
        console.warn(`[Dashboard] Failed to fetch data from ${fetcher.name}. Using default value. Error: ${error.message}`);
        return defaultValue;
    }
};

/**
 * Aggregates all relevant real-time system performance metrics.
 * Optimizes fetching using concurrent processing (Promise.all) with added resilience (safeFetch).
 *
 * @returns {Promise<{
 *   timestamp: number,
 *   consensus: { trustDecayRate: number, currentConsensusThreshold: number },
 *   agents: { successRates: Object<string, number> },
 *   performance: { sicHitRate: number, validatedCreativity: number }
 * }>}
 */
export async function generateRuntimeReport() {
    // Define structured defaults to ensure the report object is always stable.
    const ATM_DEFAULTS = { decayRate: NaN, scores: {} };
    const MCRA_DEFAULTS = NaN;
    const METRICS_DEFAULTS = { sicHitRate: NaN, validatedCreativity: NaN };

    const [ 
        atmResult, 
        mcraThresholdResult,
        systemMetricsResult
    ] = await Promise.all([
        safeFetch(fetchAtmScores, ATM_DEFAULTS),
        safeFetch(getMcraThresholds, MCRA_DEFAULTS),
        safeFetch(fetchSystemMetrics, METRICS_DEFAULTS) 
    ]);

    const report = {
        timestamp: Date.now(), // Critical for temporal monitoring

        // Categorized System State (Intelligence Enhancement)
        consensus: {
            trustDecayRate: atmResult.decayRate,
            currentConsensusThreshold: mcraThresholdResult,
        },

        agents: {
            successRates: atmResult.scores,
        },

        performance: {
            sicHitRate: systemMetricsResult.sicHitRate,
            validatedCreativity: systemMetricsResult.validatedCreativity,
        },
    };

    return report;
}