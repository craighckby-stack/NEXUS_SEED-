/**
 * Logger.js
 * Standardized logging utility for high-level system operations (v94.1).
 * Assumes 'chalk' is available for environment formatting.
 */

// WARNING: This file assumes a Node.js environment where 'chalk' and 'process' are available.
const chalk = require('chalk'); 

// --- Plugin Integration ---

interface LogRouterResult {
    shouldLog: boolean;
    timestamp?: string;
    prefix?: string;
    level?: string;
    targetMethod?: 'log' | 'warn' | 'error';
}

// Configuration: Determine the effective log level based on environment or default.
// Note: This relies on the LevelFilteredLogRouter plugin being accessible (AGI_KERNEL.LevelFilteredLogRouter).
const ENV_LEVEL_STRING = (typeof process !== 'undefined' && process.env && process.env.LOG_LEVEL) || 'INFO';
const DEFAULT_PREFIX = 'TQM_ENG';

// Conceptual interface to the extracted tool
const LevelFilteredLogRouter: { execute: (args: { level: string, prefix: string, messages: any[], config: { ENV_LEVEL: string } }) => LogRouterResult } = AGI_KERNEL.LevelFilteredLogRouter; 


class Logger {
    /**
     * Generic logging handler.
     * @param {string} level - ERROR, WARN, INFO, DEBUG
     * @param {string} prefix - Component identifier (e.g., TQM_ENG)
     * @param {Array<any>} message - The log payload
     */
    log(level: string, prefix: string, ...message: any[]) {
        
        const upperLevel = level.toUpperCase();

        // 1. Use the plugin for level filtering and structure generation
        const result = LevelFilteredLogRouter.execute({
            level: upperLevel,
            prefix: prefix,
            messages: message,
            config: { ENV_LEVEL: ENV_LEVEL_STRING }
        });
        
        if (!result.shouldLog) {
            return;
        }
        
        const { timestamp, targetMethod } = result;
        let outputPrefix;
        
        // 2. Apply environment-specific formatting (chalk) and final output routing
        
        switch (upperLevel) {
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
                // Retain existing security/environment check for DEBUG
                if (typeof process === 'undefined' || process.env.NODE_ENV !== 'production') {
                   console.log(outputPrefix, ...message);
                }
                break;
            default:
                // Handle custom or unrecognized levels using the generic router output
                const defaultPrefix = `[${timestamp}][${prefix}][${upperLevel}]`;
                const consoleFn = console[targetMethod as keyof Console] || console.log;
                consoleFn(defaultPrefix, ...message);
        }
    }
    
    // Context-specific wrapper functions
    error(...m: any[]) { this.log('ERROR', DEFAULT_PREFIX, ...m); }
    warn(...m: any[]) { this.log('WARN', DEFAULT_PREFIX, ...m); }
    info(...m: any[]) { this.log('INFO', DEFAULT_PREFIX, ...m); }
    debug(...m: any[]) { this.log('DEBUG', DEFAULT_PREFIX, ...m); }
}

module.exports = new Logger();