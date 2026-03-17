import { ILoggerToolKernel } from '@tools/logging/ILoggerToolKernel';
import { GovernanceHealthConfigRegistryKernel } from '@config/GovernanceHealthConfigRegistryKernel';
import { IExternalMetricExecutionToolKernel } from '@tools/metrics/IExternalMetricExecutionToolKernel';
import { MetricNormalizerToolKernel } from '@tools/metrics/MetricNormalizerToolKernel';
import { IMetricProcessingPipelineConfigRegistryKernel } from '@config/IMetricProcessingPipelineConfigRegistryKernel';
import { IConceptualPolicyEvaluatorKernel } from '@tools/policy/IConceptualPolicyEvaluatorKernel';

/**
 * GovernanceHealthMonitorKernel
 * This Kernel replaces the synchronous Governance Health Monitor utility.
 * It achieves maximum computational efficiency by strictly enforcing asynchronous
 * operations and uses recursive abstraction by delegating metric processing,
 * normalization, and policy evaluation to specialized Tool Kernels.
 * All state retrieval and evaluation is non-blocking and auditable.
 */
export class GovernanceHealthMonitorKernel {
    #configRegistry;
    #metricExecutor;
    #metricNormalizer;
    #pipelineConfig;
    #policyEvaluator;
    #logger;
    #initialized = false;

    /**
     * @param {GovernanceHealthConfigRegistryKernel} configRegistry
     * @param {IExternalMetricExecutionToolKernel} metricExecutor
     * @param {MetricNormalizerToolKernel} metricNormalizer
     * @param {IMetricProcessingPipelineConfigRegistryKernel} pipelineConfig
     * @param {IConceptualPolicyEvaluatorKernel} policyEvaluator
     * @param {ILoggerToolKernel} logger
     */
    constructor(
        configRegistry,
        metricExecutor,
        metricNormalizer,
        pipelineConfig,
        policyEvaluator,
        logger
    ) {
        this.#configRegistry = configRegistry;
        this.#metricExecutor = metricExecutor;
        this.#metricNormalizer = metricNormalizer;
        this.#pipelineConfig = pipelineConfig;
        this.#policyEvaluator = policyEvaluator;
        this.#logger = logger;
    }

    /**
     * Initializes the kernel, loading necessary configurations asynchronously.
     * @async
     */
    async initialize() {
        if (this.#initialized) return;
        
        // Asynchronously load necessary configurations from Audited Registries
        await Promise.all([
            this.#configRegistry.initialize(),
            this.#pipelineConfig.initialize()
        ]);

        await this.#logger.debug('GovernanceHealthMonitorKernel initialized successfully.', { conceptId: 'GOV_I_010' });
        this.#initialized = true;
    }

    /**
     * Executes the comprehensive health check utilizing recursive abstraction
     * for metric acquisition, normalization, and policy evaluation.
     * @async
     * @param {Object} context The current execution context.
     * @returns {Promise<Object>} The structured, immutable health report.
     */
    async checkHealth(context) {
        if (!this.#initialized) {
            throw new Error('GOV_E_001: GovernanceHealthMonitorKernel not initialized. Call initialize() first.');
        }

        // 1. Retrieve required configurations (asynchronous lookup)
        const healthConfig = await this.#configRegistry.getHealthThresholds();
        const pipelineSteps = await this.#pipelineConfig.getMetricProcessingPipeline('system_health');
        
        // 2. Asynchronously retrieve raw system metrics (external I/O delegation)
        const rawMetrics = await this.#metricExecutor.execute(healthConfig.requiredMetrics);
        
        // 3. Normalize and process metrics (delegation to MetricNormalizerToolKernel)
        let processedMetrics = rawMetrics;
        for (const step of pipelineSteps) {
            processedMetrics = await this.#metricNormalizer.process(processedMetrics, step);
        }

        // 4. Evaluate processed metrics against governance policy (Recursive Abstraction via Policy Kernel)
        const policyContext = { 
            metrics: processedMetrics, 
            thresholds: healthConfig.evaluationThresholds,
            checkType: 'SystemHealth'
        };
        
        const evaluationResult = await this.#policyEvaluator.evaluate(
            'GOV_HEALTH_CHECK_POLICY',
            policyContext
        );

        const healthReport = {
            timestamp: Date.now(),
            status: evaluationResult.status, // e.g., HEALTHY, DEGRADED, CRITICAL
            conceptId: evaluationResult.conceptId || 'HEALTH_REPORT',
            details: evaluationResult.details,
            metricsSnapshot: processedMetrics
        };

        await this.#logger.info('System Health Check Completed', { reportStatus: healthReport.status, context });

        // Return immutable state, adhering to AIA Enforcement Layer mandates.
        return Object.freeze(healthReport);
    }
}