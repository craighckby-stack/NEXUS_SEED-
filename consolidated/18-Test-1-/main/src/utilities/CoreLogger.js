/**
 * Sovereign AGI Core Structured Logger Utility v1.0
 * Provides a standardized interface for structured logging across all AGI modules.
 * Ensures easy integration with centralized observability platforms (e.g., Splunk, Elastic).
 */
class CoreLogger {
    constructor(moduleName) {
        this.module = moduleName;
    }

    _log(level, message, metadata = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            module: this.module,
            message: message,
            ...metadata,
        };
        
        // In a production AGI system, this would stream to Kafka/Logstash/etc.
        // For scaffolding, we default to console, ensuring structure remains.
        const output = JSON.stringify(logEntry);
        
        if (level === 'error' || level === 'warn') {
            console.error(output);
        } else {
            console.log(output);
        }
    }

    info(message, metadata) { this._log('info', message, metadata); }
    warn(message, metadata) { this._log('warn', message, metadata); }
    error(message, metadata) { this._log('error', message, metadata); }
    debug(message, metadata) { this._log('debug', message, metadata); }
}

// Global singleton for ease of use across the application
const singletonLogger = new CoreLogger('SYSTEM');
global.CORE_LOGGER = singletonLogger; // Inject into global scope for quick access

module.exports = CoreLogger;
