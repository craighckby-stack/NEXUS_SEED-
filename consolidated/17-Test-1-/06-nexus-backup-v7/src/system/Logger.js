/**
 * Utility Component: SystemLogger v94.2 (Refactored for Plugin Integration)
 * Role: Provides standardized, structured logging across the Sovereign AGI system.
 * Mandate: Ensures logs are easily parseable, include structured context, and respects severity levels using the LogEntryProcessor tool.
 */

// Placeholder declaration for the assumed available plugin interface
declare const LogEntryProcessor: {
    execute: (args: {
        componentName: string;
        level: string;
        message: string;
        context?: Record<string, any>;
        environment?: Record<string, string>;
    }) => {
        shouldEmit: boolean;
        outputString: string;
        logEntry: Record<string, any>;
        level: string;
    };
};

class SystemLogger {

    private componentName: string;

    /**
     * @param {string} componentName - The module or component initializing the logger.
     */
    constructor(componentName: string = 'System') {
        this.componentName = componentName;
    }

    /**
     * Internal logging function to format and output the log entry using the LogEntryProcessor plugin.
     * @param {string} level
     * @param {string} message
     * @param {Record<string, any>} [context={}]
     */
    private _log(level: string, message: string, context: Record<string, any> = {}): void {

        let processedLog;
        try {
            // Utilize the plugin to handle formatting, timestamping, and emission filtering.
            processedLog = LogEntryProcessor.execute({
                componentName: this.componentName,
                level,
                message,
                context
                // Relying on the plugin to correctly access global process.env or defaults
            });
        } catch (e) {
            // Fail safe logging if plugin execution fails
            console.error(`[Plugin Error] Failed to process log entry: ${(e as Error).message}`, { level, message, component: this.componentName });
            return;
        }

        if (!processedLog.shouldEmit) {
            return;
        }

        const { outputString, logEntry } = processedLog;

        // Output based on determined level
        switch (processedLog.level) {
            case 'error':
                console.error(outputString, logEntry);
                break;
            case 'warn':
                console.warn(outputString, logEntry);
                break;
            case 'info':
                console.info(outputString, logEntry);
                break;
            case 'debug':
            default:
                console.log(outputString, logEntry);
                break;
        }
    }

    /**
     * Logs an error message.
     * @param {string} message
     * @param {Record<string, any>} [context]
     */
    public error(message: string, context?: Record<string, any>): void {
        this._log('error', message, context);
    }

    /**
     * Logs a warning message.
     * @param {string} message
     * @param {Record<string, any>} [context]
     */
    public warn(message: string, context?: Record<string, any>): void {
        this._log('warn', message, context);
    }

    /**
     * Logs an informational message.
     * @param {string} message
     * @param {Record<string, any>} [context]
     */
    public info(message: string, context?: Record<string, any>): void {
        this._log('info', message, context);
    }

    /**
     * Logs a debug message.
     * @param {string} message
     * @param {Record<string, any>} [context]
     */
    public debug(message: string, context?: Record<string, any>): void {
        this._log('debug', message, context);
    }
}

/**
 * Factory function to create a logger instance for a specific component.
 * @param {string} componentName
 * @returns {SystemLogger}
 */
const getLogger = (componentName: string): SystemLogger => new SystemLogger(componentName);

module.exports = { SystemLogger, getLogger };
