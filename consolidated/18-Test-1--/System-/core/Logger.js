/**
 * Unified System Logger Utility
 * Provides structured, context-aware logging to replace scattered console.log/error calls.
 */
export default class Logger {
    /**
     * @param {string} context - The module or service initiating the log (e.g., 'SpecificationLoader').
     */
    constructor(context = 'System') {
        this.context = context;
        // Configuration could be expanded here (e.g., defining output format, minimum level)
    }

    _getTimestamp() {
        return new Date().toISOString();
    }

    _log(level, message, data) {
        const entry = {
            timestamp: this._getTimestamp(),
            level: level.toUpperCase(),
            context: this.context,
            message: message
        };
        
        const logMethod = console[level.toLowerCase()] || console.log;
        const output = data ? JSON.stringify(data) : '';
        
        logMethod(`[${entry.timestamp}] [${entry.level}] (${entry.context}): ${entry.message} ${output}`.trim());
    }

    info(message, data) { this._log('INFO', message, data); }
    warn(message, data) { this._log('WARN', message, data); }
    error(message, data) { this._log('ERROR', message, data); }
    
    // Specialized severe logging
    fatal(message, data) { this._log('FATAL', message, data); }
    success(message, data) { this._log('SUCCESS', message, data); }
}