/**
 * Sovereign AGI Core Structured Logger Utility v1.0
 * Provides a standardized interface for structured logging across all AGI modules.
 * Ensures easy integration with centralized observability platforms (e.g., Splunk, Elastic).
 */
class CoreLogger {
    /**
     * Creates a new CoreLogger instance.
     * @param {string} moduleName - The name of the module using the logger
     */
    constructor(moduleName) {
        if (!moduleName || typeof moduleName !== 'string') {
            throw new Error('Module name must be a non-empty string');
        }
        this.module = moduleName;
    }

    /**
     * Internal logging method that creates structured log entries
     * @private
     * @param {string} level - Log level (info, warn, error, debug)
     * @param {string} message - Log message
     * @param {Object} metadata - Additional metadata to include in the log
     */
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
        
        const logMethod = level === 'error' || level === 'warn' ? 'console.error' : 'console.log';
        console[logMethod === 'console.error' ? 'error' : 'log'](output);
    }

    /**
     * Log an info message
     * @param {string} message - The message to log
     * @param {Object} [metadata] - Additional metadata to include
     */
    info(message, metadata) {
        this._log('info', message, metadata);
    }

    /**
     * Log a warning message
     * @param {string} message - The message to log
     * @param {Object} [metadata] - Additional metadata to include
     */
    warn(message, metadata) {
        this._log('warn', message, metadata);
    }

    /**
     * Log an error message
     * @param {string} message - The message to log
     * @param {Object} [metadata] - Additional metadata to include
     */
    error(message, metadata) {
        this._log('error', message, metadata);
    }

    /**
     * Log a debug message
     * @param {string} message - The message to log
     * @param {Object} [metadata] - Additional metadata to include
     */
    debug(message, metadata) {
        this._log('debug', message, metadata);
    }
}

// Global singleton for ease of use across the application
const singletonLogger = new CoreLogger('SYSTEM');
global.CORE_LOGGER = singletonLogger; // Inject into global scope for quick access

module.exports = CoreLogger;
