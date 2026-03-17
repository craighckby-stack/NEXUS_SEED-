/**
 * MetricEngineCollectorKernel (v94.3)
 * Responsible for dynamic metric sourcing and calculation execution via Strategy Pattern, 
 * integrating dedicated logging, post-processing services, and dedicated template validation.
 *
 * Adheres to strict Kernel architectural requirements: asynchronous initialization, 
 * synchronous setup extraction, and Dependency Injection using formalized interfaces.
 */
class MetricEngineCollectorKernel {
    /**
     * @type {IMetricDefinitionConfigRegistryKernel}
     * @private
     */
    #repository;

    /**
     * @type {IMetricExecutionStrategyProviderToolKernel}
     * @private
     */
    #handlersProvider;

    /**
     * @type {ILoggerToolKernel}
     * @private
     */
    #logger;

    /**
     * @type {IMetricPostProcessorToolKernel}
     * @private
     */
    #postProcessor;

    /**
     * @type {IMetricTemplateValidatorToolKernel}
     * @private
     */
    #templateValidator;

    /**
     * MetricEngineCollectorKernel
     * @param {object} dependencies - Dependencies object conforming to kernel interfaces.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Ensures all dependencies are present and assigns them.
     * Enforces the synchronous setup extraction mandate.
     * @param {object} dependencies 
     * @private
     */
    #setupDependencies({ repository, handlers, logger, postProcessor, templateValidator }) {
        if (!repository) throw new Error("MetricEngineCollectorKernel requires IMetricDefinitionConfigRegistryKernel (repository).");
        if (!handlers) throw new Error("MetricEngineCollectorKernel requires IMetricExecutionStrategyProviderToolKernel (handlers).");
        if (!logger) throw new Error("MetricEngineCollectorKernel requires ILoggerToolKernel (logger).");
        if (!postProcessor) throw new Error("MetricEngineCollectorKernel requires IMetricPostProcessorToolKernel (postProcessor).");
        if (!templateValidator) throw new Error("MetricEngineCollectorKernel requires IMetricTemplateValidatorToolKernel (templateValidator).");

        this.#repository = repository;
        this.#handlersProvider = handlers; // Strategy map provider
        this.#logger = logger;
        this.#postProcessor = postProcessor;
        this.#templateValidator = templateValidator;
    }

    /**
     * Standard asynchronous initialization interface.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Configuration loading or complex startup logic would go here.
    }

    /**
     * Handles the outcome of the template validation, determining if execution should proceed, skip, or fail.
     * @param {string} metricId - The ID of the metric being processed.
     * @param {object} validationResult - The result from templateValidator.execute.
     * @returns {object|null} A structured response if processing should stop (SKIPPED or FAILURE), otherwise null to proceed.
     * @private
     */
    #handleValidationResult(metricId, validationResult) {
        if (validationResult.valid) {
            return null; // Proceed
        }

        this.#logger.warn(`Metric ID ${metricId} validation failure: ${validationResult.reason}.`);
        
        // Handle SKIPPED status (e.g., InactiveStatus)
        if (validationResult.reason === 'InactiveStatus') {
            return { metricId, status: 'SKIPPED', timestamp: Date.now(), value: null };
        }
        
        // Handle definite failures (TemplateNotFound, HandlerNotConfigured, etc.)
        return this.#postProcessor.createFailureResponse(metricId, validationResult.reason);
    }

    /**
     * Collects and calculates a specific metric based on its configuration template.
     * @param {string} metricId - The ID of the metric to collect.
     * @returns {Promise<object>}
     * The calculated and standardized metric result (or structured failure status).
     */
    async collectMetric(metricId) {
        
        // Step 1: Validate metric template and handler using the dedicated tool
        const validationResult = this.#templateValidator.execute({
            metricId: metricId,
            repository: this.#repository, // Injecting the registry
            handlers: this.#handlersProvider // Injecting the strategy provider
        });

        // Handle validation outcome (Success, Skip, or Failure)
        const earlyResponse = this.#handleValidationResult(metricId, validationResult);
        if (earlyResponse) {
            return earlyResponse;
        }

        const { template, handler } = validationResult;
        const method = template.calculation_method;

        try {
            this.#logger.info(`Executing metric ${metricId} via method: ${method}`);
            
            // Step 2: Execute the strategy handler
            const rawResult = await handler.execute(template);
            
            // Step 3: Delegate to PostProcessor for validation, transformation, and threshold checking
            return this.#postProcessor.process(template, rawResult);
            
        } catch (error) {
            this.#logger.error(`Failure collecting metric ${metricId} (Method: ${method}):`, error instanceof Error ? error.stack : String(error));
            
            // Step 4: Use postProcessor to standardize internal execution failures
            return this.#postProcessor.createFailureResponse(
                metricId, 
                'ExecutionError', 
                error instanceof Error ? error.message : 'Unknown execution error'
            );
        }
    }
}

module.exports = MetricEngineCollectorKernel;