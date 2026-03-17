/**
 * Component ID: TLY (Telemetry Logger)
 * Functional Focus: Structured, persistent, and severity-controlled logging system for AGI operational events.
 * GSEP Alignment: Mandatory for all Stages (M-07 Audit Trail).
 *
 * Provides structured logging for operational data, warnings, and critical failures, ensuring all events are timestamped,
 * tagged by component, and easily queryable for auditing purposes.
 */
class TelemetryLogger {
    constructor(persistenceClient, serviceId) {
        this.client = persistenceClient; // E.g., database or dedicated logging stream connector
        this.serviceId = serviceId; // e.g., 'RSAM', 'CIM', 'KTAM'
        this.logLevelMap = { 
            'DEBUG': 1, 'INFO': 2, 'WARN': 3, 'CRITICAL': 4, 'SUCCESS': 2 
        };
        this.currentLogLevel = process.env.LOG_LEVEL_THRESHOLD || 2; // Default to INFO
    }

    /**
     * Logs a structured event asynchronously.
     * @param {string} level - Log level (e.g., 'INFO', 'CRITICAL').
     * @param {string} eventCode - Specific event identifier (e.g., 'RSAM_POLICY_STAGED').
     * @param {object} payload - Structured data associated with the event.
     */
    async log(level, eventCode, payload) {
        const levelNumeric = this.logLevelMap[level.toUpperCase()];
        if (levelNumeric < this.currentLogLevel) {
            return;
        }

        const record = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            component: this.serviceId,
            eventCode: eventCode,
            data: payload
        };

        try {
            // In a real system, this would queue or persist the log entry
            await this.client.writeLog(record);
            // Fallback for immediate visibility during dev/testing
            console.log(`[${record.level}][${record.component}] ${eventCode}:`, payload);
        } catch (error) {
            console.error('TLY Persistence Failure:', error, record);
            // Note: If persistence fails, the critical governance audit trail is broken.
        }
    }

    info(eventCode, payload) { this.log('INFO', eventCode, payload); }
    warn(eventCode, payload) { this.log('WARN', eventCode, payload); }
    critical(eventCode, payload) { this.log('CRITICAL', eventCode, payload); }
    success(eventCode, payload) { this.log('SUCCESS', eventCode, payload); }
}

module.exports = TelemetryLogger;