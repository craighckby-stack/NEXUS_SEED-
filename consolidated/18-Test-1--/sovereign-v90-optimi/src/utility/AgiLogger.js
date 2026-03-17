/**
 * Sovereign AGI v95.0 - AgiLogger
 * Function: Standardized, structured logging utility for critical AGI operations.
 * Features: Contextual logging (module source), pure JSON output for centralized processing, and runtime configurable levels.
 */

// --- Plugin Integration: StructuredLogEmitter ---
// All logging policy (levels, filtering, formatting, output) is delegated to the kernel plugin.
// This constant represents the injected plugin instance.
const LogEmitter: { 
    emit(args: { level: string, message: string, data?: object, source: string }): void; 
} = {
    emit: (args) => {
        // In runtime, this call is mapped directly to the StructuredLogEmitter plugin implementation.
        // We rely on kernel dependency injection here.
    }
};

class AgiLogger {
    private source: string;

    /**
     * @param {string} sourceModule - The name of the module originating the log (e.g., 'SRM', 'MemoryKernel').
     */
    constructor(sourceModule: string) {
        this.source = sourceModule;
    }

    /**
     * Private method to delegate emission to the StructuredLogEmitter plugin.
     * @param {string} level - The log severity level ('INFO', 'ERROR', etc.).
     * @param {string} message - The main human-readable message.
     * @param {object} [data={}] - Optional structured data payload.
     */
    private _emit(level: string, message: string, data: object = {}): void {
        // Delegate all logic (filtering, formatting, output) to the external plugin.
        LogEmitter.emit({
            level: level,
            message: message,
            data: data,
            source: this.source,
        });
    }

    // Public logging methods
    debug(message: string, data?: object): void {
        this._emit('DEBUG', message, data);
    }

    info(message: string, data?: object): void {
        this._emit('INFO', message, data);
    }

    warn(message: string, data?: object): void {
        this._emit('WARN', message, data);
    }
    
    error(message: string, data?: object): void {
        this._emit('ERROR', message, data);
    }

    critical(message: string, data?: object): void {
        this._emit('CRITICAL', message, data);
    }
}

module.exports = AgiLogger;