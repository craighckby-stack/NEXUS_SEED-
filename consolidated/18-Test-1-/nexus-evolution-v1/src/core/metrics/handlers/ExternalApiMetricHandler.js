/**
 * ExternalApiMetricHandler
 * Specific handler implementation for fetching metrics via external REST APIs.
 * Implements the required execute(template) interface for MetricEngineCollector.
 */
class ExternalApiMetricHandler {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }

    /**
     * Executes the metric collection based on the template source configuration.
     * @param {object} template - The metric definition template containing source_config.
     * @returns {Promise<any>} The raw value returned by the external API.
     */
    async execute(template) {
        if (!template.source_config) {
            throw new Error("API Metric handler requires 'source_config' in the template.");
        }
        
        // The internal apiClient handles network, authentication, and structured error propagation.
        return this.apiClient.fetch(template.source_config);
    }
}

module.exports = ExternalApiMetricHandler;
