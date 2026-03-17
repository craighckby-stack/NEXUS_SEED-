const LogLevels = {
    TRACE: 0,
    DEBUG: 1,
    INFO: 2,
    SUCCESS: 2,
    WARN: 3,
    ERROR: 4,
    FATAL: 5,
};

/**
 * Component ID: TLY (Telemetry Logger)
 * Functional Focus: Structured, persistent, and severity-controlled logging system for AGI operational events.
 * GSEP Alignment: Mandatory for all Stages (M-07 Audit Trail).
 *
 * Provides structured logging for operational data, warnings, and critical failures, ensuring all events are timestamped,
 * tagged by component, and easily queryable for auditing purposes. Utilizes non-blocking persistence.
 */
class TelemetryLogger {
    constructor(persistenceClient, serviceId, logLevelThreshold = null) {
        if (!persistenceClient || typeof persistenceClient.writeLog !== 'function') {
            throw new Error('TLY initialization requires a valid persistenceClient with a writeLog method.');
        }

        this.client = persistenceClient;
        this.serviceId = serviceId;
        
        // Determine the effective numeric log level threshold
        const thresholdName = (logLevelThreshold || process.env.LOG_LEVEL_THRESHOLD || 'INFO').toUpperCase();
        this.currentLogLevel = LogLevels[thresholdName] !== undefined 
                               ? LogLevels[thresholdName] 
                               : LogLevels.INFO;
        
        // Map convenience methods to the log function
        this.trace = (eventCode, payload) => this.log('TRACE', eventCode, payload);
        this.debug = (eventCode, payload) => this.log('DEBUG', eventCode, payload);
        this.info = (eventCode, payload) => this.log('INFO', eventCode, payload);
        this.success = (eventCode, payload) => this.log('SUCCESS', eventCode, payload);
        this.warn = (eventCode, payload) => this.log('WARN', eventCode, payload);
        this.error = (eventCode, payload) => this.log('ERROR', eventCode, payload); // Replaces old 'critical'
        this.critical = this.error; // Backwards compatibility alias
        this.fatal = (eventCode, payload) => this.log('FATAL', eventCode, payload);
    }

    /**
     * Internal generic logging function.
     * Uses StructuralLogFormatterTool for filtering and record creation, ensuring fast exit if threshold is not met.
     * Persistence handling is delegated to a non-blocking internal method.
     */
    async log(level, eventCode, payload = {}) {
        // Use the extracted tool to handle filtering and formatting
        const record = StructuralLogFormatterTool.execute({
            level: level,
            eventCode: eventCode,
            payload: payload,
            serviceId: this.serviceId,
            currentLogLevel: this.currentLogLevel,
            LogLevels: LogLevels // Pass the constant map for lookup
        });

        if (!record) {
            return; // Log level filtered out
        }

        // Non-blocking call to the persistence layer.
        this._persistRecord(record);
    }

    /**
     * Handles the actual persistence attempt and failure fallback.
     */
    async _persistRecord(record) {
        // Fallback for immediate visibility during dev/testing (avoid noisy trace/debug logs)
        if (record.levelNumeric >= LogLevels.INFO) {
             console.log(`[${record.level}:${record.levelNumeric}][${record.component}] ${record.eventCode}:`, record.data);
        }

        try {
            await this.client.writeLog(record);
        } catch (error) {
            // CRITICAL FAILURE: Immediate breach of M-07 Audit Trail governance.
            const failureTime = new Date().toISOString();
            console.error(
                `[${failureTime}] TLY PERSISTENCE FAILED (Audit Trail Compromise):`, 
                error.message, 
                `Attempted Record: ${JSON.stringify(record).substring(0, 200)}...`
            );
        }
    }
}

module.exports = { TelemetryLogger, LogLevels };
