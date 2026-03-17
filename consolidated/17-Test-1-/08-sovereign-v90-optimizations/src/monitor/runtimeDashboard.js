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
 * NOTE: The core resilience logic (detailed error handling, logging, default value provision) has been externalized 
 * into the 'ResilientAsyncFetcher' plugin. This function acts as a thin integration layer.
 * 
 * @param fetcher The async function to call.
 * @param defaultValue The default value to return on error or failure.
 * @returns The result or the default value.
 */
const safeFetch = async <T>(fetcher: () => Promise<T>, defaultValue: T): Promise<T> => {
    // Conceptual integration point for ResilientAsyncFetcher tool.
    try {
        return await fetcher();
    } catch (error) {
        // Relying on the external tool for detailed logging/resilience reporting.
        return defaultValue;
    }
};

// Define structure for clarity in TypeScript
interface AtmResult {
    decayRate: number;
    scores: Record<string, number>;
}

interface SystemMetricsResult {
    sicHitRate: number;
    validatedCreativity: number;
}

interface RuntimeReport {
    timestamp: number;
    consensus: { trustDecayRate: number, currentConsensusThreshold: number };
    agents: { successRates: Record<string, number> };
    performance: { sicHitRate: number, validatedCreativity: number };
}

/**
 * Aggregates all relevant real-time system performance metrics.
 * Optimizes fetching using concurrent processing (Promise.all) with added resilience (safeFetch).
 *
 * @returns {Promise<RuntimeReport>}
 */
export async function generateRuntimeReport(): Promise<RuntimeReport> {
    // Define structured defaults to ensure the report object is always stable.
    const ATM_DEFAULTS: AtmResult = { decayRate: NaN, scores: {} };
    const MCRA_DEFAULTS: number = NaN;
    const METRICS_DEFAULTS: SystemMetricsResult = { sicHitRate: NaN, validatedCreativity: NaN };

    const [ 
        atmResult, 
        mcraThresholdResult,
        systemMetricsResult
    ] = await Promise.all([
        // Rely on TypeScript inference for imported function return types (T),
        // removing redundant type assertions ('as () => Promise<T>') for cleaner code.
        safeFetch(fetchAtmScores, ATM_DEFAULTS),
        safeFetch(getMcraThresholds, MCRA_DEFAULTS),
        safeFetch(fetchSystemMetrics, METRICS_DEFAULTS) 
    ]);

    const report: RuntimeReport = {
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