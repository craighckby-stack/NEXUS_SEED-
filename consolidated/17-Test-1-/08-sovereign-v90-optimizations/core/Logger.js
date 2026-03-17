/**
 * Unified System Logger Utility
 * Provides structured, context-aware logging, leveraging StructuralLogFormatterUtility.
 */

// --- Module-level Dependency Resolution ---

// Assuming StructuralLogFormatterUtility is globally injected by the kernel environment.
const KernelLogUtility = (typeof StructuralLogFormatterUtility !== 'undefined' && typeof StructuralLogFormatterUtility.execute === 'function') 
    ? StructuralLogFormatterUtility 
    : null;

const USE_KERNEL_UTILITY = !!KernelLogUtility;

export default class Logger {
    #context;

    /**
     * Maps custom log levels to standard browser/node console methods for fallback.
     * Frozen to ensure immutability of core logging configuration.
     */
    static #CONSOLE_METHOD_MAP = Object.freeze({
        INFO: 'info',
        WARN: 'warn',
        ERROR: 'error',
        FATAL: 'error', 
        SUCCESS: 'log' 
    });

    /**
     * @param {string} context - The module or service initiating the log (e.g., 'SpecificationLoader').
     */
    constructor(context = 'System') {
        this.#context = context;
    }

    /**
     * Retrieves the appropriate console function for fallback logging based on the LogLevel.
     */
    #getConsoleMethod(level) {
        const methodKey = Logger.#CONSOLE_METHOD_MAP[level];
        // Ensure we always return a callable function, falling back to console.log
        return console[methodKey] || console.log;
    }

    /**
     * Delegates the structured logging request to the external Kernel Utility 
     * if the utility is available. Returns true if delegation occurred.
     * Enforces architectural consistency by isolating the core dependency execution (I/O proxy).
     */
    #attemptKernelDelegation(levelStr, message, data) {
        if (USE_KERNEL_UTILITY) {
            KernelLogUtility.execute(levelStr, this.#context, message, data);
            return true;
        }
        return false;
    }

    /**
     * Handles core logging by delegating formatting and output to the external utility,
     * or using a structured console fallback.
     */
    #log(level, message, data) {
        const levelStr = level.toUpperCase();

        // 1. Primary Path: Attempt delegation to kernel utility
        if (this.#attemptKernelDelegation(levelStr, message, data)) {
            return;
        }

        // 2. Fallback Path: Structured Console Logging
        const timestamp = new Date().toISOString();
        
        const dataOutput = data ? ` (Data: ${JSON.stringify(data)})` : '';
        const logMethod = this.#getConsoleMethod(level);
        
        // Format: [TIMESTAMP] [LEVEL] (CONTEXT): MESSAGE DATA
        logMethod(`[${timestamp}] [${levelStr}] (${this.#context}): ${message}${dataOutput}`);
    }

    // Public API
    info(message, data) { this.#log('INFO', message, data); }
    warn(message, data) { this.#log('WARN', message, data); }
    error(message, data) { this.#log('ERROR', message, data); }
    
    // Specialized severe logging
    fatal(message, data) { this.#log('FATAL', message, data); }
    success(message, data) { this.#log('SUCCESS', message, data); }
}