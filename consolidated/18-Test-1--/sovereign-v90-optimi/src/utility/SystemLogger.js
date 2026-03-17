/**
 * System Logger Utility (v94.2 - Strategy Compliant)
 * Provides structured, tiered logging (CRITICAL, ERROR, WARN, INFO, DEBUG)
 * for high-intelligence autonomous processes, replacing direct console calls.
 * This implementation delegates core logic (filtering, formatting, output)
 * to the TieredSystemLoggerUtility plugin, focusing on component encapsulation
 * and minimizing boilerplate.
 */

// NOTE: TieredSystemLoggerUtility is assumed to be available via the AGI-KERNEL plugin infrastructure.
const TieredSystemLoggerUtility = require('../plugins/TieredSystemLoggerUtility'); // Placeholder path

// Define supported log levels to enforce consistency and enable DRY implementation.
const LOG_LEVELS = ['CRITICAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];

class SystemLogger {
    /**
     * Creates a namespaced logger instance.
     * @param {string} component - The source component name (e.g., 'GovernanceValidator').
     */
    constructor(component) {
        // Enforce component naming for governance telemetry traceability.
        if (typeof component !== 'string' || component.trim() === '') {
            throw new Error("SystemLogger requires a valid component name for initialization.");
        }
        this.component = component;
    }

    /**
     * Internal method to delegate logging execution to the utility plugin.
     * 
     * NOTE ON PERFORMANCE: This structure relies on the underlying TieredSystemLoggerUtility
     * adhering to the strategy ledger mandate (numerical weighting) to perform
     * efficient level filtering *before* execution, preventing unnecessary serialization.
     * 
     * @param {string} level 
     * @param {string} message 
     * @param {object} [data={}] 
     */
    _log(level, message, data = {}) {
        TieredSystemLoggerUtility.execute({
            component: this.component,
            level: level,
            message: message,
            data: data
        });
    }

    /**
     * Set the global logging threshold for all SystemLogger instances via the utility plugin.
     * @param {string} level - E.g., 'INFO', 'DEBUG', 'CRITICAL'.
     */
    static setLevel(level) {
        if (TieredSystemLoggerUtility.setLevel) {
            TieredSystemLoggerUtility.setLevel(level);
        } else {
            // Fallback warning if configuration fails
            console.warn(`AGI-KERNEL LOG_CONFIG_FAIL: TieredSystemLoggerUtility lacks setLevel implementation. Attempted level: ${level}`);
        }
    }
}

// Dynamically generate public logging methods (critical, error, warn, info, debug) 
// based on the defined LOG_LEVELS array (DRY principle adherence).
LOG_LEVELS.forEach(level => {
    const methodName = level.toLowerCase();
    SystemLogger.prototype[methodName] = function(message, data) {
        this._log(level, message, data);
    };
});

module.exports = SystemLogger;