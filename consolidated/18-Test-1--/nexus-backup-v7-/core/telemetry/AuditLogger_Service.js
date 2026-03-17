/**
 * @typedef {Object} AuditEvent
 * @property {string} entity - The system or component initiating the event (e.g., 'AGENT_CORE').
 * @property {string} action - The specific operation performed (e.g., 'REFRACTOR_START', 'DATA_ACCESS').
 * @property {number} timestamp - Unix timestamp of the event.
 * @property {string} level - Log level ('INFO', 'WARNING', 'CRITICAL').
 * @property {Object} details - Arbitrary structured payload.
 */

/**
 * @typedef {Object} AuditSinkConfig
 * @property {Array<IAuditLogSink>} sinks - An array of log sink plugins.
 * @property {LoggerConfig} loggerConfig - The Logger configuration.
 * @property {AuditLoggerConfig} auditLoggerConfig - The AuditLogger configuration.
 */

/**
 * @typedef {Object} LoggerConfig
 * @property {string} logLevel - The log level for the Logger.
 * @property {string} logFilePath - The file path for log persistence.
 */

/**
 * @typedef {Object} AuditLoggerConfig
 * @property {string} logDirectory - The directory path for audit log persistence.
 * @property {string} logFormat - The format for audit log entries.
 */

/**
 * AuditLogger_Service provides a centralized, decoupled mechanism
 * for logging immutable audit events across the AGI system.
 */
class AuditLogger_Service {
    
    /**
     * @type {Array<IAuditLogSink>}
     */
    #sinks = [];

    /**
     * Initializes the Audit Logger Service.
     * Requires external log sink plugins (implementing IAuditLogSink).
     * @param {AuditSinkConfig} config - An object containing the sinks and logger/audit configurations.
     */
    constructor(config) {
        this.#setupSinks(config.sinks);
        this.#initializeValidation();
        this.#configureLogger(config.loggerConfig);
        this.#configureAuditLogger(config.auditLoggerConfig);
    }

    /**
     * @type {Logger}
     */
    #logger;

    /**
     * @type {AuditLogger}
     */
    #auditLogger;

    /**
     * Extracts dependency resolution and assignment.
     * @param {Array<IAuditLogSink>} sinks
     */
    #setupSinks(sinks) {
        if (!sinks || !Array.isArray(sinks)) {
            throw new Error("AuditLogger_Service requires an array of sinks.");
        }
        this.#sinks = sinks;
    }

    /**
     * Performs synchronous validation of sink dependencies.
     */
    #initializeValidation() {
        // Ensure all sinks implement the required methods
        this.#sinks.forEach(sink => {
            if (typeof sink.log !== 'function') {
                throw new Error(`Sink ${sink.constructor.name} does not implement required 'log(event)' method.`);
            }
        });
    }

    /**
     * @type {Record<string, string>}
     */
    #loggerConfig;

    /**
     * @type {Record<string, string>}
     */
    #auditLoggerConfig;

    /**
     * Configures the Logger instance.
     * @param {LoggerConfig} config - The Logger configuration.
     */
    #configureLogger(config) {
        // Create a custom Logger implementation based on the provided configuration
        this.#logger = new Logger(config.logLevel, config.logFilePath);
    }

    /**
     * Configures the Audit Logger instance.
     * @param {AuditLoggerConfig} config - The AuditLogger configuration.
     */
    #configureAuditLogger(config) {
        // Create a custom Audit Logger implementation based on the provided configuration
        this.#auditLogger = new AuditLogger(config.logDirectory, config.logFormat);
    }

    /**
     * Standardizes an event payload into the official AuditEvent structure.
     *
     * @param {string} entity 
     * @param {string} action 
     * @param {string} level 
     * @param {Object} details 
     * @returns {AuditEvent}
     */
    #prepareNormalizedEvent(entity, action, level, details = {}) {
        return {
            entity: entity.toUpperCase(),
            action: action.toUpperCase(),
            timestamp: Date.now(),
            level: level.toUpperCase(),
            details: details,
        };
    }

    /**
     * Logs a general information audit event.
     * @param {string} entity 
     * @param {string} action 
     * @param {Object} [details={}] 
     */
    async info(entity, action, details = {}) {
        const event = this.#prepareNormalizedEvent(entity, action, 'INFO', details);
        await this.#delegateToEventDispatch(event);
    }

    /**
     * Logs a critical system warning or error event.
     * @param {string} entity 
     * @param {string} action 
     * @param {Object} [details={}] 
     */
    async critical(entity, action, details = {}) {
        const event = this.#prepareNormalizedEvent(entity, action, 'CRITICAL', details);
        await this.#delegateToEventDispatch(event);
    }
    
    /**
     * Isolates interaction with the external IAuditLogSink dependency (I/O Proxy).
     * @param {IAuditLogSink} sink
     * @param {AuditEvent} event
     */
    async #delegateToSinkLogging(sink, event) {
        // We wrap the async call in a Promise.resolve().catch() to ensure logging failures are handled internally
        try {
            await Promise.resolve(sink.log(event));
        } catch (error) {
            // This log handles errors specific to the sink's persistence logic
            console.error(`[AUDIT_ERROR] Failed dispatch to sink ${sink.constructor.name}:`, error);
        }
    }

    /**
     * Dispatches the event to all registered sinks asynchronously (I/O Orchestration).
     * Ensures dispatch failures in one sink do not prevent logging in others.
     * @param {AuditEvent} event 
     */
    async #delegateToEventDispatch(event) {
        if (this.#sinks.length === 0) {
            // Fallback for systems running without configured persistence
            console.warn(`[AUDIT_FALLBACK] No sinks configured. Event: ${event.entity}/${event.action}`);
            return;
        }

        const dispatchPromises = this.#sinks.map(sink => {
            // Delegate actual dependency interaction to the dedicated I/O proxy
            return this.#delegateToSinkLogging(sink, event);
        });

        // Wait for all sinks to complete or fail gracefully
        await Promise.all(dispatchPromises);
    }
}

/**
 * Logger implementation based on the provided configuration.
 */
class Logger {
    #level;
    #filePath;

    constructor(level, filePath) {
        this.#level = level;
        this.#filePath = filePath;
    }

    log(level, message) {
        // Simple implementation for demonstration purposes
        console.log(`${level} [LOGGER] ${message}`);
    }
}

/**
 * AuditLogger implementation based on the provided configuration.
 */
class AuditLogger {
    #logDirectory;
    #logFormat;

    constructor(logDirectory, logFormat) {
        this.#logDirectory = logDirectory;
        this.#logFormat = logFormat;
    }

    log(event) {
        // Simple implementation for demonstration purposes
        console.log(`AUDIT ${event.action} [ENTITY: ${event.entity}, TIMESTAMP: ${event.timestamp}]`);
    }
}

module.exports = { AuditLogger_Service };