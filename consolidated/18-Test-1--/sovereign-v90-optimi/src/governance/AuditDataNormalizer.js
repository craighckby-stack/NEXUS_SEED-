/**
 * src/governance/AuditDataNormalizerKernel.js
 * Purpose: Processes raw system telemetry and audit logs, transforming them into the
 * normalized metrics [0.0, 1.0] required by the PerformanceMetricGenerator.
 * This kernel ensures all normalization logic is executed asynchronously and relies on
 * centralized configuration management and specialized normalization tools.
 */

class AuditDataNormalizerKernel {
    #metricNormalizer;
    #configRegistry;
    #logger;
    #thresholds;
    #isInitialized = false;

    /**
     * @param {object} dependencies
     * @param {MetricNormalizerToolKernel} dependencies.metricNormalizerToolKernel - Tool for standard metric normalization logic (e.g., linear scaling).
     * @param {IAuditDataNormalizationConfigRegistryKernel} dependencies.auditDataNormalizationConfigRegistryKernel - Registry for operational thresholds.
     * @param {ILoggerToolKernel} dependencies.loggerToolKernel - Standard logger for error reporting.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    #setupDependencies(dependencies) {
        if (!dependencies) {
            throw new Error("AuditDataNormalizerKernel requires dependencies.");
        }

        this.#metricNormalizer = dependencies.metricNormalizerToolKernel;
        this.#configRegistry = dependencies.auditDataNormalizationConfigRegistryKernel;
        this.#logger = dependencies.loggerToolKernel;

        if (!this.#metricNormalizer || !this.#configRegistry || !this.#logger) {
            throw new Error("Missing required kernel dependencies: metricNormalizerToolKernel, auditDataNormalizationConfigRegistryKernel, or loggerToolKernel.");
        }
    }
    
    /**
     * Loads configuration asynchronously. Must be called before `normalize`.
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            this.#thresholds = await this.#configRegistry.getNormalizationThresholds();
            if (!this.#thresholds || Object.keys(this.#thresholds).length === 0) {
                 this.#logger.error("Failed to load normalization thresholds from registry.");
                 throw new Error("Configuration initialization failed for AuditDataNormalizerKernel: Empty thresholds.");
            }
            this.#isInitialized = true;
        } catch (error) {
            this.#logger.error("Error during AuditDataNormalizerKernel initialization.", { error: error.message });
            throw error; 
        }
    }


    /**
     * Normalizes all collected raw data into the format required by the metric generator.
     * 
     * @param {string} actorId - ID of the component being audited.
     * @param {object} rawTelemetry - Raw telemetry and event logs.
     * @param {number} rawTelemetry.p95LatencyMs - Observed 95th percentile latency.
     * @param {number} rawTelemetry.resourceUsagePct - Observed maximum resource usage percentage.
     * @param {number} rawTelemetry.complianceChecksRun - Total policy checks executed.
     * @param {number} rawTelemetry.complianceChecksFailed - Total policy checks failed.
     * @param {number} rawTelemetry.seriousViolations - Count of severe policy breaches.
     * @returns {Promise<object>} Normalized Audit Data (complianceScore, violationCount, efficiencyScore).
     */
    async normalize(actorId, rawTelemetry) {
        if (!this.#isInitialized) {
            throw new Error("AuditDataNormalizerKernel must be initialized before calling normalize.");
        }

        const { 
            p95LatencyMs = Infinity,
            resourceUsagePct = 0,
            complianceChecksRun = 0,
            complianceChecksFailed = 0,
            seriousViolations = 0 
        } = rawTelemetry;

        const { 
            P95_LATENCY_GOOD_MS, 
            P95_LATENCY_BAD_MS,
            RESOURCE_USAGE_MAX_PCT 
        } = this.#thresholds;

        // Resource usage normalization ceiling
        const RESOURCE_USAGE_BAD_PCT = 100;

        // 1. Calculate Compliance Score (Ratio of successful checks)
        let complianceScore = 1.0;
        if (complianceChecksRun > 0) {
            const successChecks = complianceChecksRun - complianceChecksFailed;
            complianceScore = successChecks / complianceChecksRun;
        }

        // 2. Calculate Efficiency Score Components using the injected MetricNormalizerToolKernel
        
        // 2a. Latency Score
        const latencyScore = this.#metricNormalizer.normalizeLinearScore(
            p95LatencyMs,
            P95_LATENCY_GOOD_MS,
            P95_LATENCY_BAD_MS
        );

        // 2b. Resource Score
        const resourceScore = this.#metricNormalizer.normalizeLinearScore(
            resourceUsagePct,
            RESOURCE_USAGE_MAX_PCT, 
            RESOURCE_USAGE_BAD_PCT
        );

        // 2c. Final Efficiency Score: Limited by the worst metric (bottleneck principle)
        const efficiencyScore = Math.min(latencyScore, resourceScore);

        return {
            complianceScore: parseFloat(complianceScore.toFixed(4)),
            violationCount: seriousViolations,
            efficiencyScore: parseFloat(efficiencyScore.toFixed(4))
        };
    }
}

module.exports = AuditDataNormalizerKernel;