// FILE: src/monitor/runtimeDashboard.js
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
 * Aggregates all relevant real-time system performance metrics.
 * This function optimizes fetching using concurrent processing and returns a stable metrics object.
 * It relies on the new `metricsAggregator` to provide real, calculated KPIs rather than simulated data.
 *
 * @returns {Promise<{
 *   trustDecayRate: number,
 *   currentConsensusThreshold: number,
 *   agentSuccessRates: Object<string, number>,
 *   sicHitRate: number,
 *   validatedCreativity: number
 * }>}
 */
export async function generateRuntimeReport() {
    // Concurrent data fetching optimization via Promise.all
    const [
        atmData, 
        mcraThreshold,
        systemMetrics
    ] = await Promise.all([
        fetchAtmScores(),
        getMcraThresholds(),
        fetchSystemMetrics() 
    ]);

    const report = {
        // Consensus Metrics (ATM)
        trustDecayRate: atmData.decayRate,
        agentSuccessRates: atmData.scores,

        // Consensus Metrics (MCRA)
        currentConsensusThreshold: mcraThreshold,

        // System Performance Metrics (from Aggregator)
        sicHitRate: systemMetrics.sicHitRate,
        validatedCreativity: systemMetrics.validatedCreativity,
    };

    return report;
}

// export function renderDashboard() { ... (For actual rendering logic, omitted for CLI focused scaffold) }