/**
 * Sovereign AGI v95.0 - AgiLogger
 * Function: Standardized, structured logging utility for critical AGI operations.
 * Features: Contextual logging (module source), pure JSON output for centralized processing, and runtime configurable levels.
 */

// --- Static Configuration ---

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    CRITICAL: 4
};

// Retrieve configuration dynamically (will rely on ConfigService integration later)
const DEFAULT_MIN_LEVEL = 'INFO';
const MIN_LOG_LEVEL_NAME = (process.env.AGI_LOG_LEVEL || DEFAULT_MIN_LEVEL).toUpperCase();
const MIN_LOG_LEVEL_VALUE = LOG_LEVELS[MIN_LOG_LEVEL_NAME] !== undefined 
    ? LOG_LEVELS[MIN_LOG_LEVEL_NAME] 
    : LOG_LEVELS.INFO;


class AgiLogger {
    /**
     * @param {string} sourceModule - The name of the module originating the log (e.g., 'SRM', 'MemoryKernel').
     */
    constructor(sourceModule) {
        this.source = sourceModule;
        this.minLevelValue = MIN_LOG_LEVEL_VALUE;
        this.LOG_LEVELS = LOG_LEVELS;
    }

    timestamp() {
        return new Date().toISOString();
    }

    _getConsoleMethod(level) {
        switch (level) {
            case 'ERROR':
            case 'CRITICAL':
                return console.error;
            case 'WARN':
                return console.warn;
            case 'DEBUG':
                // Use console.debug if available, otherwise console.log
                return console.debug || console.log;
            case 'INFO':
            default:
                return console.log;
        }
    }

    /**
     * Private method to emit the structured log entry.
     * @param {string} level - The log severity level ('INFO', 'ERROR', etc.).
     * @param {string} message - The main human-readable message.
     * @param {object} [data={}] - Optional structured data payload.
     */
    _emit(level, message, data = {}) {
        const levelValue = this.LOG_LEVELS[level];

        if (levelValue === undefined || levelValue < this.minLevelValue) {
            return;
        }

        const logEntry = {
            time: this.timestamp(),
            level: level,
            source: this.source,
            message: message,
            // Conditionally add 'payload' only if structured data is present
            ...(Object.keys(data).length > 0 ? { payload: data } : {})
        };

        const consoleMethod = this._getConsoleMethod(level);
        
        // Crucial Refactor: Always output structured JSON for efficient machine parsing.
        consoleMethod(JSON.stringify(logEntry));
    }

    // Public logging methods
    debug(message, data) {
        this._emit('DEBUG', message, data);
    }

    info(message, data) {
        this._emit('INFO', message, data);
    }

    warn(message, data) {
        this._emit('WARN', message, data);
    }
    
    error(message, data) {
        this._emit('ERROR', message, data);
    }

    critical(message, data) {
        this._emit('CRITICAL', message, data);
    }
}

module.exports = AgiLogger;