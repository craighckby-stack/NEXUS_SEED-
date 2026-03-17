/**
 * AXEL_ConstraintGovernor.js
 * 
 * Utility for implementing Adaptive QoS based on real-time performance metrics.
 * Dynamically overrides AXEL_RuntimeConfig constraints to optimize resource utilization.
 */

const MIN_TIMEOUT_MS = 50;
const MAX_TIMEOUT_MS = 1000;

export function calculateOptimalConstraints(currentConstraints, performanceMetrics) {
    const { successful_evaluations, failed_timeouts, average_latency_ms } = performanceMetrics;
    let newTimeout = currentConstraints.evaluation_timeout_ms;

    // Adaptive logic: If timeout failure rate exceeds 5% and average latency is high, increase tolerance.
    if (failed_timeouts / (successful_evaluations + failed_timeouts) > 0.05) {
        newTimeout = Math.min(newTimeout * 1.2, MAX_TIMEOUT_MS);
    } else if (average_latency_ms < (newTimeout * 0.5)) {
        // If we are consistently too fast, gently reduce timeout to save resources.
        newTimeout = Math.max(newTimeout * 0.9, MIN_TIMEOUT_MS);
    }

    return {
        ...currentConstraints,
        evaluation_timeout_ms: Math.round(newTimeout)
    };
}