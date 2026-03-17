/**
 * Utility Component: SystemLogger v94.1
 * Role: Provides standardized, structured logging across the Sovereign AGI system.
 * Mandate: Ensures logs are easily parseable, include structured context, and respect severity levels.
 */
class SystemLogger {
    
    /**
     * @param {string} componentName - The module or component initializing the logger.
     */
    constructor(componentName = 'System') {
        this.componentName = componentName;
    }

    /**
     * Internal logging function to format and output the log entry.
     */
    _log(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const output = `[${timestamp}] [${level.toUpperCase()}] [${this.componentName}] ${message}`;

        // Define the structured log entry
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            component: this.componentName,
            message,
            ...context
        };

        // Output based on level
        switch (level) {
            case 'error':
                console.error(output, logEntry);
                break;
            case 'warn':
                console.warn(output, logEntry);
                break;
            case 'info':
                console.info(output, logEntry);
                break;
            case 'debug':
                // Typically suppressed in production unless explicitly enabled
                if (process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug') {
                    console.log(output, logEntry);
                }
                break;
            default:
                console.log(output, logEntry);
        }
    }

    error(message, context) { this._log('error', message, context); }
    warn(message, context) { this._log('warn', message, context); }
    info(message, context) { this._log('info', message, context); }
    debug(message, context) { this._log('debug', message, context); }
}

/**
 * Factory function to create a logger instance for a specific component.
 * @param {string} componentName 
 * @returns {SystemLogger}
 */
const getLogger = (componentName) => new SystemLogger(componentName);

module.exports = { SystemLogger, getLogger };