/**
 * utility/Logger.js
 * Standardized logging utility for high-level system operations (v94.2).
 */

const chalk = require('chalk');

const LOG_LEVELS = Object.freeze({
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
});

// Configurable via environment variable or central system configuration
const currentLevel = LOG_LEVELS.INFO;

class Logger {
    constructor(defaultPrefix = 'SYSTEM') {
        this.defaultPrefix = defaultPrefix;
    }
    
    /**
     * Generic logging handler.
     * @param {string} level - ERROR, WARN, INFO, DEBUG
     * @param {string} prefix - Component identifier (e.g., KERNEL)
     * @param {Array<any>} message - The log payload
     */
    log(level, prefix, ...message) {
        if (LOG_LEVELS[level] <= currentLevel) {
            const timestamp = new Date().toISOString();
            let outputPrefix;
            
            switch (level) {
                case 'ERROR':
                    outputPrefix = chalk.red(`[${timestamp}][${prefix}][ERROR]`);
                    console.error(outputPrefix, ...message);
                    break;
                case 'WARN':
                    outputPrefix = chalk.yellow(`[${timestamp}][${prefix}][WARN]`);
                    console.warn(outputPrefix, ...message);
                    break;
                case 'INFO':
                    outputPrefix = chalk.blue(`[${timestamp}][${prefix}][INFO]`);
                    console.log(outputPrefix, ...message);
                    break;
                case 'DEBUG':
                    outputPrefix = chalk.gray(`[${timestamp}][${prefix}][DEBUG]`);
                    // Ensure debug output does not pollute error streams
                    if (process.env.NODE_ENV !== 'production') {
                       console.log(outputPrefix, ...message);
                    }
                    break;
                default:
                    console.log(`[${timestamp}][${prefix}]`, ...message);
            }
        }
    }
    
    // Context-specific wrapper functions, now utilizing the instance's default prefix
    error(...m) { this.log('ERROR', this.defaultPrefix, ...m); }
    warn(...m) { this.log('WARN', this.defaultPrefix, ...m); }
    info(...m) { this.log('INFO', this.defaultPrefix, ...m); }
    debug(...m) { this.log('DEBUG', this.defaultPrefix, ...m); }
}

// Instantiate the default singleton logger, maintaining the historical 'TQM_ENG' prefix.
const SystemLogger = new Logger('TQM_ENG');

// Export the primary instance (default export) and the Logger class (named export) for UNIFIER modularity.
module.exports = SystemLogger;
module.exports.Logger = Logger;
