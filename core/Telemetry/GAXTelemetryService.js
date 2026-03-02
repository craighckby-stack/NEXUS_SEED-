// core/Telemetry/GAXTelemetryService.js
// Purpose: Centralized, structured logging and event emission for the GAX lifecycle, ensuring auditability and traceability.

const { TelemetryProvider } = require('./TelemetryProvider.js'); 
const { IdGenerator } = require('../Utils/IdGenerator.js'); 
const GAXEvents = require('./GAXEventRegistry.js'); // Standardized event names

/**
 * @typedef {object} TelemetryContext
 * @property {string} component - The source component (e.g., 'CORE', 'PVF', 'GSEP').
 * @property {string} runId - The unique ID tracking the specific execution run (required for auditing cycles).
 * @property {string=} policyId - The ID of the policy being processed, if applicable.
 */

/**
 * GAX Telemetry Service facilitates auditing and monitoring of Policy Evolution cycles.
 * It standardizes logging output structure and acts as the official entry point for all GAX system events.
 */
class GAXTelemetryService {

    /**
     * Generates a robust, unique run ID prefixed for easy identification.
     * @param {string} prefix - The component prefix (e.g., 'PVF', 'GSEP-C').
     * @returns {string} The generated unique ID.
     */
    static createRunId(prefix) {
        // IdGenerator is assumed to use high-integrity methods (e.g., UUIDs or similar transaction IDs)
        return IdGenerator.create(`RUN_${prefix}`); 
    }

    /**
     * Publishes a generic structured event to the underlying TelemetryProvider.
     * Enforces structure using explicit context and data separation.
     * @param {string} eventName - Standardized event name (should be retrieved from GAXEventRegistry).
     * @param {TelemetryContext} context - Structured contextual metadata (component, runId).
     * @param {object} [data={}] - Detailed event payload data.
     * @param {string} [level='info'] - Log level ('info', 'warn', 'error', 'debug', 'fatal').
     */
    static publish(eventName, context, data = {}, level = 'info') {
        // Input validation for critical context elements
        if (!context || !context.component || !context.runId) {
            // Self-logging error if crucial context is missing for traceability.
            TelemetryProvider.log('error', GAXEvents.DIAG_CONTEXT_MISSING, {
                requiredFields: ['component', 'runId'],
                receivedContext: context,
                originalEvent: eventName,
                timestamp: Date.now()
            });
            // Assign safe defaults for the compromised event
            context = { component: 'GAX_CORE', runId: 'N/A', ...context };
        }

        const standardPayload = {
            eventName: eventName,
            metadata: {
                timestamp: Date.now(),
                level: level,
                ...context
            },
            data: data
        };
        
        // Use a standardized, concise message for human readability/grepping,
        // while relying on the structured payload for machine analysis.
        const message = `[GAX][${context.runId}][${context.component}] ${eventName}`;

        TelemetryProvider.log(level, message, standardPayload);
    }

    // --- Specialized High-Level Wrappers (Simplified signatures) ---

    /** 
     * Logs debug information.
     * @param {string} eventName - Must be a key from GAXEventRegistry. 
     * @param {TelemetryContext} context 
     * @param {object=} data 
     */
    static debug(eventName, context, data) {
        this.publish(eventName, context, data, 'debug');
    }

    /** 
     * Logs routine information. 
     * @param {string} eventName - Must be a key from GAXEventRegistry. 
     * @param {TelemetryContext} context 
     * @param {object=} data 
     */
    static info(eventName, context, data) {
        this.publish(eventName, context, data, 'info');
    }

    /** 
     * Logs warnings about non-critical issues. 
     * @param {string} eventName - Must be a key from GAXEventRegistry. 
     * @param {TelemetryContext} context 
     * @param {object=} data 
     */
    static warn(eventName, context, data) {
        this.publish(eventName, context, data, 'warn');
    }

    /** 
     * Logs errors indicating failures that might require intervention. 
     * @param {string} eventName - Must be a key from GAXEventRegistry. 
     * @param {TelemetryContext} context 
     * @param {object=} data 
     */
    static error(eventName, context, data) {
        this.publish(eventName, context, data, 'error');
    }

    /** 
     * Logs fatal errors leading to system halt or critical failure. 
     * @param {string} eventName - Must be a key from GAXEventRegistry. 
     * @param {TelemetryContext} context 
     * @param {object=} data 
     */
    static fatal(eventName, context, data) {
        this.publish(eventName, context, data, 'fatal');
    }
    
    /** 
     * Logs successful operations (alias for info). 
     * @param {string} eventName - Must be a key from GAXEventRegistry.
     * @param {TelemetryContext} context 
     * @param {object=} data 
     */
    static success(eventName, context, data) {
        this.publish(eventName, context, data, 'info');
    }
    
    /** 
     * Logs operational failures (alias for error). 
     * @param {string} eventName - Must be a key from GAXEventRegistry.
     * @param {TelemetryContext} context 
     * @param {object=} data 
     */
    static failure(eventName, context, data) {
        this.publish(eventName, context, data, 'error');
    }
}

module.exports = GAXTelemetryService;