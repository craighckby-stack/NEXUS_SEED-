/**
 * Component ID: RCEK
 * Name: Resource Constraint Evaluator Kernel
 * Function: Provides dynamic, asynchronous, real-time operational context
 *           (Constraint Factor) to the MCRA Engine (C-11) based on governed thresholds.
 * GSEP Alignment: Stage 3 (P-01 Input)
 * Architectural Compliance: Fully asynchronous, maximum recursive abstraction achieved.
 */

/**
 * @typedef {Object} ConstraintConfig
 * @property {number} threshold
 * @property {number} weight
 * @property {number} severity_boost
 */

/**
 * @typedef {Object} RawMetrics
 * @property {number} cpu_util Normalized CPU utilization (0.0 to 1.0).
 * @property {number} memory_used_ratio Normalized memory usage ratio (0.0 to 1.0).
 * @property {number} io_wait_factor Normalized I/O wait factor (0.0 to 1.0).
 */

/**
 * @typedef {Object} TriggerDetail
 * @property {string} metric
 * @property {number} value
 * @property {number} threshold
 * @property {number} weight
 * @property {number} penalty_contribution
 * @property {'CRITICAL' | 'PROXIMITY'} type
 */

/**
 * @typedef {Object} ScoreData
 * @property {number} score The aggregate constraint factor (0.0 to 1.0).
 * @property {TriggerDetail[]} triggers Detailed list of triggered constraints.
 */

const DEFAULT_CONSTRAINTS = {
    // Note: Metrics are expected to be normalized ratios (0.0 to 1.0)
    cpu_util: { threshold: 0.85, weight: 0.40, severity_boost: 2.0 }, 
    memory_used_ratio: { threshold: 0.90, weight: 0.50, severity_boost: 3.0 }, // Higher penalty for memory, critical path resource
    io_wait_factor: { threshold: 0.60, weight: 0.10, severity_boost: 1.5 }
};

class ResourceConstraintEvaluatorKernel {
    /** @type {GovernanceHealthConfigRegistryKernel} */
    #configRegistry;
    /** @type {IExternalMetricExecutionToolKernel} */
    #metricFetcher;
    /** @type {IGovernanceConstraintEvaluatorToolKernel} */
    #constraintEvaluator;
    /** @type {MultiTargetAuditDisperserToolKernel} */
    #auditDisperser;

    #isInitialized = false;

    /**
     * @param {Object} dependencies
     * @param {GovernanceHealthConfigRegistryKernel} dependencies.GovernanceHealthConfigRegistryKernel 
     * @param {IExternalMetricExecutionToolKernel} dependencies.IExternalMetricExecutionToolKernel 
     * @param {IGovernanceConstraintEvaluatorToolKernel} dependencies.IGovernanceConstraintEvaluatorToolKernel
     * @param {MultiTargetAuditDisperserToolKernel} dependencies.MultiTargetAuditDisperserToolKernel
     */
    constructor({
        GovernanceHealthConfigRegistryKernel: configRegistry,
        IExternalMetricExecutionToolKernel: metricFetcher,
        IGovernanceConstraintEvaluatorToolKernel: constraintEvaluator,
        MultiTargetAuditDisperserToolKernel: auditDisperser
    }) {
        if (!configRegistry || !metricFetcher || !constraintEvaluator || !auditDisperser) {
            throw new Error("RCEK: Mandatory tool kernels missing.");
        }
        this.#configRegistry = configRegistry;
        this.#metricFetcher = metricFetcher;
        this.#constraintEvaluator = constraintEvaluator;
        this.#auditDisperser = auditDisperser;
    }

    /**
     * Asynchronously initializes the kernel, registering default constraints.
     * @returns {Promise<void>}
     */
    async initialize() {
        await this.#configRegistry.registerDefaults('resourceConstraints', DEFAULT_CONSTRAINTS);
        this.#isInitialized = true;
    }

    /**
     * Internal utility to asynchronously gather and normalize raw operational metrics.
     * Replaces synchronous metricsService access.
     * @returns {Promise<RawMetrics>} Normalized raw metrics.
     */
    async #fetchRawMetrics() {
        if (!this.#isInitialized) throw new Error("Kernel must be initialized before fetching metrics.");
        
        try {
            // Use the Metric Execution Tool to fetch a standardized set of metrics (0.0 to 1.0 ratios).
            const metrics = await this.#metricFetcher.execute({
                metricSetId: 'OPERATIONAL_CONTEXT_METRICS',
                scope: 'SYSTEM_HEALTH'
            });

            /** @type {RawMetrics} */
            const normalizedMetrics = {
                cpu_util: metrics?.cpu_util ?? 0,
                memory_used_ratio: metrics?.memory_used_ratio ?? 0,
                io_wait_factor: metrics?.io_wait_factor ?? 0
            };
            
            return normalizedMetrics;

        } catch (error) {
            await this.#auditDisperser.logAudit({
                level: 'CRITICAL',
                message: `[RCEK] Metric Fetch Critical Error: ${error.message}`,
                data: { error_stack: error.stack }
            });
            // Return safety default metrics (zero) if the underlying service fails.
            return { cpu_util: 0, memory_used_ratio: 0, io_wait_factor: 0 };
        }
    }

    /**
     * Delegates quantification of raw metrics to the Governance Constraint Evaluator Tool.
     * @param {RawMetrics} rawMetrics - Flattened current system metrics.
     * @returns {Promise<ScoreData>} Calculated score and detailed list of triggered constraints.
     */
    async #calculateAggregateConstraintScore(rawMetrics) {
        // Fetch current active constraints (configuration is asynchronous via registry)
        const config = await this.#configRegistry.get('resourceConstraints');
        
        /** @type {ScoreData} */
        const scoreData = await this.#constraintEvaluator.evaluateConstraintScore({
            metrics: rawMetrics,
            constraints: config,
            // Enforce non-linear scaling as mandated by Refactor V94.1
            calculationMode: 'NON_LINEAR_WEIGHTED_DEVIATION' 
        });
        
        return scoreData;
    }

    /**
     * Gathers current environmental constraints and quantifies them into a contextual overhead metric.
     * @returns {Promise<{constraintMetric: number, triggeredConstraints: TriggerDetail[], details: RawMetrics}>} 
     */
    async getOperationalContext() {
        if (!this.#isInitialized) {
            throw new Error("ResourceConstraintEvaluatorKernel is not initialized.");
        }

        const rawMetrics = await this.#fetchRawMetrics();
        const scoreData = await this.#calculateAggregateConstraintScore(rawMetrics);

        return {
            constraintMetric: parseFloat(scoreData.score.toFixed(4)), // Normalized factor (0.0 to 1.0)
            triggeredConstraints: scoreData.triggers, // Detailed list of factors, including contribution
            details: rawMetrics
        };
    }

    /**
     * Primary interface for the MCRA Engine (C-11).
     * @returns {Promise<number>} A normalized factor (0.0 to 1.0) representing current resource scarcity/instability.
     */
    async getConstraintFactor() {
        const context = await this.getOperationalContext();
        return context.constraintMetric;
    }
}

module.exports = ResourceConstraintEvaluatorKernel;
