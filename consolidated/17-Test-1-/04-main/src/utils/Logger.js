/**
 * A standardized, context-aware logging utility.
 * Replace this with a robust external library (e.g., winston, pino) if system constraints allow.
 */
export class Logger {
    /**
     * @param {string} context - The component/service name for logging context.
     */
    constructor(context = 'APP') {
        this.context = `[${context}]`;
        this.level = process.env.LOG_LEVEL || 'info'; 
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    _log(level, ...args) {
        if (this.levels[level] <= this.levels[this.level]) {
            const timestamp = new Date().toISOString();
            // Use console appropriate function (log for debug, otherwise error/warn/info)
            const consoleFn = (level === 'debug') ? 'log' : level;
            
            console[consoleFn](`${timestamp} ${this.context} ${level.toUpperCase()}:`, ...args);
        }
    }

    error(...args) {
        this._log('error', ...args);
    }

    warn(...args) {
        this._log('warn', ...args);
    }

    info(...args) {
        this._log('info', ...args);
    }

    debug(...args) {
        this._log('debug', ...args);
    }
}