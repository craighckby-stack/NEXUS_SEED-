/**
 * @file src/core/metrics/MetricPostProcessorKernel.js
 * 
 * MetricPostProcessorKernel executes a defined pipeline of metric transformation steps.
 * It is initialized with a canonical pipeline retrieved from the Metric Processing 
 * Pipeline Configuration Registry.
 */

/**
 * @typedef {import('../../interfaces/kernels/ILoggerToolKernel').ILoggerToolKernel} ILoggerToolKernel
 * @typedef {import('../../interfaces/registries/IMetricProcessingPipelineConfigRegistryKernel').IMetricProcessingPipelineConfigRegistryKernel} IMetricProcessingPipelineConfigRegistryKernel
 * @typedef {import('../../interfaces/registries/IMetricProcessingPipelineConfigRegistryKernel').IMetricProcessingStep} IMetricProcessingStep
 * @typedef {import('../../interfaces/tools/IConfigurationDeepFreezeToolKernel').IConfigurationDeepFreezeToolKernel} IConfigurationDeepFreezeToolKernel
 */

class MetricPostProcessorKernel /* implements IMetricPostProcessorToolKernel */ {
    
    /** @type {IMetricProcessingStep[]} */
    processingSteps;

    /** @type {ILoggerToolKernel} */
    _logger;

    /** @type {IMetricProcessingPipelineConfigRegistryKernel} */
    _pipelineConfigRegistry;

    /** @type {IConfigurationDeepFreezeToolKernel} */
    _objectFreezer;

    /**
     * Initializes the processor with required dependencies.
     * @param {{ 
     *     logger: ILoggerToolKernel,
     *     pipelineConfigRegistry: IMetricProcessingPipelineConfigRegistryKernel,
     *     objectFreezer: IConfigurationDeepFreezeToolKernel
     * }} dependencies 
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates dependency assignment and validation, satisfying the synchronous setup extraction mandate.
     * @param {object} dependencies 
     */
    #setupDependencies(dependencies) {
        if (!dependencies) {
            throw new Error("Dependencies must be provided to MetricPostProcessorKernel.");
        }
        const { logger, pipelineConfigRegistry, objectFreezer } = dependencies;

        if (!logger || typeof logger.error !== 'function') {
            throw new Error("ILoggerToolKernel dependency (logger) is missing or invalid.");
        }
        if (!pipelineConfigRegistry || typeof pipelineConfigRegistry.getMetricProcessingSteps !== 'function') {
            throw new Error("IMetricProcessingPipelineConfigRegistryKernel dependency is missing or invalid.");
        }
        if (!objectFreezer || typeof objectFreezer.deepFreeze !== 'function') {
             throw new Error("IConfigurationDeepFreezeToolKernel dependency (objectFreezer) is missing or invalid.");
        }

        this._logger = logger;
        this._pipelineConfigRegistry = pipelineConfigRegistry;
        this._objectFreezer = objectFreezer;
    }

    /**
     * Loads and immutably stores the canonical processing pipeline configuration.
     * @returns {Promise<void>}
     */
    async initialize() {
        this._logger.info("Initializing MetricPostProcessorKernel: loading processing pipeline.");
        
        try {
            const steps = await this._pipelineConfigRegistry.getMetricProcessingSteps();
            if (!Array.isArray(steps)) {
                 this._logger.error("Metric processing steps retrieved from registry are not an array.");
                 this.processingSteps = [];
            } else {
                 // Enforce immutability on the retrieved pipeline definition using the injected tool
                 this.processingSteps = this._objectFreezer.deepFreeze(steps);
            }
        } catch (error) {
            this._logger.error(`Failed to load metric processing pipeline during initialization: ${error.message}`);
            throw error; 
        }
    }

    /**
     * Executes the asynchronous processing pipeline. It applies transformations sequentially.
     * 
     * @param {Object[]} rawMetrics - Array of raw metric objects.
     * @returns {Promise<Object[]>} Processed metrics, or an empty array if input is invalid.
     */
    async process(rawMetrics) {
        if (!Array.isArray(rawMetrics)) {
            this._logger.warn("Input to MetricPostProcessorKernel is not an array. Returning empty array.", { inputType: typeof rawMetrics });
            return [];
        }

        // Asynchronous functional reduction over the pipeline steps
        const processedMetrics = await this.processingSteps.reduce(async (accumulatorPromise, step, index) => {
            const currentMetrics = await accumulatorPromise;
            
            if (typeof step.transform !== 'function') {
                this._logger.error(`Pipeline step ${index} is missing the required 'transform' method. Skipping.`);
                return currentMetrics; 
            }

            try {
                // Apply the transformation. Steps are expected to return a Promise.
                const transformedMetrics = await step.transform(currentMetrics);

                if (!Array.isArray(transformedMetrics)) {
                    this._logger.error(`Step ${index} (Type: ${step.constructor.name || 'Anonymous'}) returned non-array output. Aborting pipeline.`);
                    // Return the last valid array state on contract violation
                    return currentMetrics; 
                }
                
                return transformedMetrics;
            } catch (error) {
                this._logger.error(`Error executing pipeline step ${index} (${step.constructor.name || 'Anonymous'}): ${error.message}`);
                // Return previous state on error
                return currentMetrics; 
            }
            
        }, Promise.resolve(rawMetrics)); 

        return processedMetrics;
    }
}

module.exports = MetricPostProcessorKernel;