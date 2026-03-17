// Sovereign AGI Metric Engine Collector (v94.2) - Refactored
// Responsible for dynamic metric sourcing and calculation execution via Strategy Pattern, 
// now integrating dedicated logging and post-processing services.

/**
 * MetricEngineCollector
 * Uses dependency injection and a handler strategy map to execute various metric calculation methods.
 */
class MetricEngineCollector {
    /**
     * @param {object} dependencies - Dependencies object
     * @param {object} dependencies.repository - Metric definition repository.
     * @param {object} dependencies.handlers - Map of calculation methods to execution services.
     * @param {object} dependencies.logger - Standardized system logger.
     * @param {object} dependencies.postProcessor - Service for validation, transformation, and threshold checks.
     */
    constructor({ repository, handlers, logger, postProcessor }) {
        if (!repository || !handlers || !logger || !postProcessor) {
            throw new Error("MetricEngineCollector initialization requires repository, handlers, logger, and postProcessor map.");
        }
        this.repository = repository;
        this.handlers = handlers; // Strategy map
        this.logger = logger;
        this.postProcessor = postProcessor;
    }

    /**
     * Retrieves the metric template safely.
     * @param {string} metricId
     * @returns {object|null}
     */
    _getTemplate(metricId) {
        // Use a defined repository getter method if available for abstraction, fallback to direct access.
        if (this.repository.getMetricTemplate) {
            return this.repository.getMetricTemplate(metricId);
        }
        return this.repository.metrics ? this.repository.metrics[metricId] : null;
    }

    /**
     * Collects and calculates a specific metric based on its configuration template.
     * @param {string} metricId - The ID of the metric to collect.
     * @returns {Promise<object>}
The calculated and standardized metric result (or structured failure status).
     */
    async collectMetric(metricId) {
        const template = this._getTemplate(metricId);

        if (!template) {
            this.logger.warn(`Metric ID ${metricId} not found in repository.`);
            return this.postProcessor.createFailureResponse(metricId, 'TemplateNotFound');
        }
        if (template.status !== 'ACTIVE') {
            this.logger.debug(`Metric ID ${metricId} is inactive.`);
            // Return a structured, inert response if skipped
            return { metricId, status: 'SKIPPED', timestamp: Date.now(), value: null };
        }

        const method = template.calculation_method;
        const handler = this.handlers[method];

        if (!handler) {
            this.logger.error(`Metric ID ${metricId}: Unsupported handler method: ${method}`);
            return this.postProcessor.createFailureResponse(metricId, 'HandlerNotConfigured');
        }

        try {
            this.logger.info(`Executing metric ${metricId} via method: ${method}`);
            
            // Step 1: Execute the strategy handler
            const rawResult = await handler.execute(template);
            
            // Step 2: Delegate to PostProcessor for validation, transformation, and threshold checking
            return this.postProcessor.process(template, rawResult);
            
        } catch (error) {
            this.logger.error(`Failure collecting metric ${metricId} (Method: ${method}):`, error.stack);
            
            // Step 3: Use postProcessor to standardize internal execution failures
            return this.postProcessor.createFailureResponse(metricId, 'ExecutionError', error.message);
        }
    }
}

module.exports = MetricEngineCollector;