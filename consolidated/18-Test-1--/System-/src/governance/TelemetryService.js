// src/governance/TelemetryService.js
// Dedicated service for auditable governance logging and metrics tracking

class TelemetryService {
    /**
     * @param {object} config - Configuration object, e.g., { logLevel: 'info' }
     */
    constructor(config = {}) {
        this.source = 'AEOR';
        this.logLevel = config.logLevel || 'info'; 
    }

    _log(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            source: this.source,
            message,
            ...metadata
        };
        
        // NOTE: In a production AIA system, this output would be asynchronously
        // piped to a durable, cryptographically verifiable audit log (D-01 requirement).
        
        // Simplified console logging for demonstration:
        const output = JSON.stringify(logEntry, null, 2);

        if (level === 'fatal' || level === 'critical') {
            console.error(output);
        } else if (level === 'error') {
            console.error(output);
        } else if (level === 'warn') {
            console.warn(output);
        } else {
            console.log(output);
        }
    }

    fatal(message, metadata) {
        this._log('fatal', message, metadata);
    }
    critical(message, metadata) {
        this._log('critical', message, metadata);
    }
    error(message, metadata) {
        this._log('error', message, metadata);
    }
    warn(message, metadata) {
        this._log('warn', message, metadata);
    }
    info(message, metadata) {
        this._log('info', message, metadata);
    }
    debug(message, metadata) {
        this._log('debug', message, metadata);
    }
}

module.exports = TelemetryService;