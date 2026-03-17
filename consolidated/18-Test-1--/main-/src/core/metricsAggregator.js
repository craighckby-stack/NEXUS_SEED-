/**
 * @module MetricsAggregator
 * @description Centralized, persistent storage and calculation layer for system performance indicators.
 * Tracks specific success metrics necessary for evaluating AGI cycles (e.g., memory utilization efficiency and innovation success).
 * The counters are reset upon reporting to provide clean, cycle-based statistics.
 */

let sicTotalQueries = 0;
let sicSuccessfulHits = 0;
let creativeMutations = 0;
let validatedCreativityCount = 0;

/**
 * Registers a query to the Strategic Insight Cache (SIC).
 * @param {boolean} hit - true if the query resulted in a successful blueprint retrieval/application.
 */
export function registerSicQuery(hit) {
    sicTotalQueries++;
    if (hit) {
        sicSuccessfulHits++;
    }
}

/**
 * Registers an attempted creative mutation (Type 3 Hallucination).
 * @param {boolean} success - true if the mutation led to a successful, non-reverting outcome (validated).
 */
export function registerCreativeMutation(success) {
    creativeMutations++;
    if (success) {
        validatedCreativityCount++;
    }
}

/**
 * Fetches calculated key performance metrics for the current cycle and resets the counters.
 * @returns {{sicHitRate: number, validatedCreativity: number, totalMutations: number}}
 */
export function fetchSystemMetrics() {
    const sicHitRate = sicTotalQueries === 0 ? 0 : sicSuccessfulHits / sicTotalQueries;

    // Capture metrics before resetting
    const metrics = {
        sicHitRate: parseFloat(sicHitRate.toFixed(4)),
        validatedCreativity: validatedCreativityCount,
        totalMutations: creativeMutations
    };

    // Reset cycle counters after retrieval
    sicTotalQueries = 0;
    sicSuccessfulHits = 0;
    creativeMutations = 0;
    validatedCreativityCount = 0;

    return metrics;
}