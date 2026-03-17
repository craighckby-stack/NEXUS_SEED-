const EventEmitter = require('events');
const CORE_LOGGER = global.CORE_LOGGER || console;

/**
 * Standard configuration defaults for the Metrics Audit Logger.
 * Freeze this object to ensure immutability during runtime.
 */
const DEFAULT_CONFIG = Object.freeze({
    flushIntervalMs: 5000, 
    maxQueueSize: 500,     
    suppressInternalErrors: true, 
});

/**
 * Metrics Audit Logger (MAL) v94.1 - Autonomous Code Evolution Module
 * Provides a standardized interface for persistent logging of critical decision metrics.
 * It uses time-based or size-based triggers for asynchronous flushing via a stream adapter.
 *
 * Requirements for streamAdapter: Must implement write(entries: Array<AuditEntry>): Promise<void>
 */
class MetricsAuditLogger extends EventEmitter {
    /**
     * @param {object} streamAdapter - Must implement write(entries: Array<AuditEntry>): Promise<void>.
     * @param {object} config - Overrides for DEFAULT_CONFIG.
     */
    constructor(streamAdapter, config = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        if (!streamAdapter || typeof streamAdapter.write !== 'function') {
            throw new Error("MetricsAuditLogger requires a streamAdapter with a 'write(data)' method signature.");
        }
        
        this.adapter = streamAdapter; 
        this.logQueue = [];
        
        // State management (using underscore convention for internal state)
        this._isFlushing = false; 
        this._isRunning = false;
        this._flushTimer = null;
        
        this.start();
    }
    
    /** 
     * Initializes periodic flushing timer and starts the logger loop. 
     */
    start() {
        if (this._isRunning) return;
        this._isRunning = true;

        const intervalHandler = () => {
            if (this.logQueue.length > 0) {
                this.flush();
            }
        };

        this._flushTimer = setInterval(intervalHandler, this.config.flushIntervalMs);
        if (this._flushTimer.unref) {
            // Ensures timer does not block the Node process from exiting cleanly
            this._flushTimer.unref(); 
        }

        CORE_LOGGER.info('MAL started.', { flushInterval: this.config.flushIntervalMs });
    }

    /** 
     * Clears the timer and executes a final, forced flush, ensuring clean shutdown. 
     */
    async shutdown() {
        if (!this._isRunning) return Promise.resolve();
        
        CORE_LOGGER.info('MAL shutting down...');
        this._isRunning = false;
        clearInterval(this._flushTimer);
        
        try {
            // Force flush remaining data, ignoring state locks
            await this.flush(true); 
            this.emit('shutdownComplete');
        } catch (e) {
            CORE_LOGGER.error('MAL Shutdown failed during final flush.', { 
                error: e.message, 
                queueSize: this.logQueue.length 
            });
        }
    }

    /**
     * Logs a specific metric event for auditing.
     * @param {string} metricType - Defines the class of metric (e.g., 'CALIBRATION', 'EXECUTION').
     * @param {object} data - The payload containing context, inputs, and outputs.
     */
    log(metricType, data) {
        if (!this._isRunning) {
            this.emit('metricDropped', { reason: 'Logger stopped', metricType });
            return;
        }
        
        const entry = {
            timestamp: new Date().toISOString(),
            metricType,
            data
        };
        
        this.logQueue.push(entry);
        this.emit('metricLogged', entry);

        // Immediate flush trigger if queue size exceeds threshold
        if (this.logQueue.length >= this.config.maxQueueSize && !this._isFlushing) {
            this.flush();
        }
    }

    /**
     * Executes the asynchronous persistence of queued metrics.
     * @param {boolean} force - If true, ignores the flushing state lock (used during shutdown/startup checks).
     */
    async flush(force = false) {
        if (this.logQueue.length === 0 || (this._isFlushing && !force)) {
            return;
        }

        this._isFlushing = true;
        
        // Atomically swap the queue references
        const entriesToFlush = this.logQueue;
        this.logQueue = [];

        try {
            await this.adapter.write(entriesToFlush);
            this.emit('flushSuccess', { count: entriesToFlush.length, adapter: this.adapter.constructor.name });
        } catch (error) {
            const errorContext = { 
                error: error.message, 
                targetAdapter: this.adapter.constructor.name,
                count: entriesToFlush.length,
                isForced: force
            };
            
            CORE_LOGGER.error('MAL Flush Failure: Persistence mechanism reported an error.', errorContext);

            // Resilience: Re-queue failed entries
            if (this.config.suppressInternalErrors) {
                // Push them to the front so they are prioritized on the next successful flush attempt.
                this.logQueue.unshift(...entriesToFlush);
                CORE_LOGGER.warn(`MAL: Re-queued ${entriesToFlush.length} entries due to adapter failure.`);
            }
            
            this.emit('flushFailure', { error, count: entriesToFlush.length });
            
        } finally {
            this._isFlushing = false;
        }
    }
}

module.exports = { MetricsAuditLogger, DEFAULT_CONFIG };
