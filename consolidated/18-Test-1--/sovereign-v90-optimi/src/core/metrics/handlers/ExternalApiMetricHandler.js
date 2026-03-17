/**
 * ExternalApiMetricHandlerKernel
 * Specific handler implementation for fetching metrics via external REST APIs.
 * Implements the required execute(template) interface for MetricEngineCollector.
 */
class ExternalApiMetricHandlerKernel {
    /**
     * @private
     * @type {IExternalMetricExecutionToolKernel}
     */
    #externalMetricExecutionToolKernel;

    /**
     * @param {IExternalMetricExecutionToolKernel} externalMetricExecutionToolKernel - Tool for executing external fetch requests based on configuration.
     */
    constructor(externalMetricExecutionToolKernel) {
        this.#setupDependencies(externalMetricExecutionToolKernel);
    }

    /**
     * Strictly isolates dependency assignment and validation.
     * @private
     * @param {IExternalMetricExecutionToolKernel} externalMetricExecutionToolKernel
     */
    #setupDependencies(externalMetricExecutionToolKernel) {
        if (!externalMetricExecutionToolKernel || typeof externalMetricExecutionToolKernel.execute !== 'function') {
            throw new Error("ExternalApiMetricHandlerKernel requires a valid IExternalMetricExecutionToolKernel with an 'execute' method.");
        }
        this.#externalMetricExecutionToolKernel = externalMetricExecutionToolKernel;
    }

    /**
     * Initializes the kernel and any internal state asynchronously.
     * @returns {Promise<void>}
     */
    async initialize() {
        return Promise.resolve();
    }

    /**
     * Executes the metric collection based on the template source configuration.
     * It delegates the API call to the injected execution tool.
     * @param {object} template - The metric definition template containing source_config.
     * @returns {Promise<any>} The raw value returned by the external API.
     */
    async execute(template) {
        if (!template || !template.source_config) {
            throw new Error("API Metric handler requires 'source_config' in the template.");
        }
        
        // Use the injected tool to execute the configured fetch request based on source_config
        return this.#externalMetricExecutionToolKernel.execute(template.source_config);
    }
}

module.exports = ExternalApiMetricHandlerKernel;