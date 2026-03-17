/**
 * System Logger Utility (v94.1)
 * Provides structured, tiered logging (INFO, WARN, CRITICAL, DEBUG) 
 * for high-intelligence autonomous processes, replacing direct console calls.
 */

const LOG_LEVELS = {
    CRITICAL: 50,
    ERROR: 40,
    WARN: 30,
    INFO: 20,
    DEBUG: 10,
};

// Default operational level. Should be configurable via GOVERNANCE_SETTINGS.
const CURRENT_LOG_LEVEL = LOG_LEVELS.INFO;

class SystemLogger {
    /**
     * Creates a namespaced logger instance.
     * @param {string} component - The source component name (e.g., 'GovernanceValidator').
     */
    constructor(component) {
        this.component = component;
    }

    _log(level, message, data = {}) {
        if (LOG_LEVELS[level] < CURRENT_LOG_LEVEL) {
            return; // Skip logging below configured level
        }

        const timestamp = new Date().toISOString();
        const output = `[${level}] [${timestamp}] [${this.component}] ${message}`;

        // Use appropriate console method based on severity
        if (LOG_LEVELS[level] >= LOG_LEVELS.ERROR) {
            console.error(output, data);
        } else if (LOG_LEVELS[level] >= LOG_LEVELS.WARN) {
            console.warn(output, data);
        } else {
            console.log(output, data);
        }
    }

    critical(message, data) { this._log('CRITICAL', message, data); }
    error(message, data) { this._log('ERROR', message, data); }
    warn(message, data) { this._log('WARN', message, data); }
    info(message, data) { this._log('INFO', message, data); }
    debug(message, data) { this._log('DEBUG', message, data); }
}

module.exports = SystemLogger;