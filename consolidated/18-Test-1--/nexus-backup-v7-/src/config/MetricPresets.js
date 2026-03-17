/**
 * Defines standard Exponential Moving Average (EMA) alpha values for common system metrics.
 * Using a centralized configuration ensures consistency and traceability of averaging policies.
 */
const MetricPresets = {
    // --- High sensitivity (quick decay, fast adaptation) ---
    LATENCY_REALTIME: {
        alpha: 0.8,
        description: "Highly responsive average for tracking real-time latency spikes."
    },

    // --- Balanced sensitivity (general use) ---
    THROUGHPUT_MEDIUM: {
        alpha: 0.15,
        description: "Balanced average suitable for general throughput and request count monitoring."
    },

    // --- High smoothing (slow decay, stable baseline) ---
    CPU_USAGE_BASELINE: {
        alpha: 0.01,
        description: "Highly smoothed average used for detecting long-term CPU usage trends and baselines."
    },

    MEMORY_USAGE_STABLE: {
        alpha: 0.05,
        description: "Smoothed average for memory utilization, filtering out short-lived garbage collection effects."
    }
};

module.exports = MetricPresets;