const LOG_LEVELS = {
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
    SILENT: 5
};

/**
 * Standardized Logger utility for engine components.
 */
class Logger {
    /** @type {number} */
    #level;
    /** @type {string} */
    #context;

    /**
     * @param {string} context - Identifier for the module or area generating the log (e.g., 'ResolutionStrategyLoader').
     * @param {number} [level=LOG_LEVELS.INFO] - The minimum level to output.
     */
    constructor(context, level = LOG_LEVELS.INFO) {
        this.#context = context;
        // Assume a global configuration determines the overall engine log level if not passed.
        this.#level = level;
    }
    
    _output(levelName, levelValue, ...args) {
        if (levelValue >= this.#level) {
            const timestamp = new Date().toISOString();
            const prefix = `[${timestamp}] [${levelName}] [${this.#context}]`;
            
            // Safely map the log level to the appropriate console method
            const consoleMethod = console[levelName.toLowerCase()] || console.log;

            // The first argument is the prefix, the rest are the original message payload
            consoleMethod(prefix, ...args);
        }
    }

    debug(...args) {
        this._output('DEBUG', LOG_LEVELS.DEBUG, ...args);
    }

    info(...args) {
        this._output('INFO', LOG_LEVELS.INFO, ...args);
    }

    warn(...args) {
        this._output('WARN', LOG_LEVELS.WARN, ...args);
    }

    error(...args) {
        this._output('ERROR', LOG_LEVELS.ERROR, ...args);
    }
}

Logger.Levels = LOG_LEVELS;
export default Logger;