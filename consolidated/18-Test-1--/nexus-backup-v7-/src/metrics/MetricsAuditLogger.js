const EventEmitter = require('events');
const CORE_LOGGER = global.CORE_LOGGER || console;

/**
 * Default Configuration for Metrics Audit Logger
 */
const DEFAULT_CONFIG = {
    flushIntervalMs: 5000, // Time-based trigger (5 seconds)
    maxQueueSize: 500,     // Size-based trigger (Flush if 500 entries are queued)
    suppressInternalErrors: true, // If true, logs error internally but doesn't throw during timed/size flush
};

/**
 * Metrics Audit Logger (MAL) v2.0 - ARCH-ATM Integration Module
 * Provides a standardized interface for logging critical decision metrics and calibration
 * parameters into a streamable, persistent audit trail. Essential for post-hoc analysis.
 *
 * Requirements for streamAdapter: Must implement write(entries: Array<AuditEntry>): Promise<void>
 */
class MetricsAuditLogger extends EventEmitter {
    constructor(streamAdapter, config = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        if (!streamAdapter || typeof streamAdapter.write !== 'function') {
            throw new Error("MetricsAuditLogger requires a streamAdapter with a 'write(data)' method.");
        }
        
        this.adapter = streamAdapter; 
        this.logQueue = [];
        this.isFlushing = false;
        this.isRunning = false;

        this.start();
    }
    
    /** Initializes periodic flushing. */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.flushTimer = setInterval(() => this._triggerFlushIfScheduled(), this.config.flushIntervalMs);
        if (this.flushTimer.unref) {
            this.flushTimer.unref(); // Ensures timer doesn't hold the process open unnecessarily
        }
    }

    /** Clears the timer and executes a final, forced flush, ensuring clean shutdown. */
    async shutdown() {
        if (!this.isRunning) return Promise.resolve();
        
        this.isRunning = false;
        clearInterval(this.flushTimer);
        
        try {
            // Flush remaining data
            await this.flush(true); 
            this.emit('shutdownComplete');
        } catch (e) {
            CORE_LOGGER.error('MAL Shutdown failed during final flush.', { error: e.message, queueSize: this.logQueue.length });
        }
    }

    _triggerFlushIfScheduled() {
        if (this.logQueue.length > 0) {
            this.flush();
        }
    }

    /**
     * Logs a specific metric event for auditing.
     * @param {string} metricType - Defines the class of metric (e.g., 'CALIBRATION', 'EXECUTION').
     * @param {object} data - The payload containing context, inputs, and outputs.
     */
    log(metricType, data) {
        if (!this.isRunning) {
            this.emit('metricDropped', { reason: 'Shutdown', metricType });
            return;
        }
        
        const entry = {
            timestamp: new Date().toISOString(),
            metricType,
            data
        };
        
        this.logQueue.push(entry);
        this.emit('metricLogged', entry);

        // Immediate flush trigger if queue size exceeds threshold and we are not currently flushing
        if (this.logQueue.length >= this.config.maxQueueSize && !this.isFlushing) {
            this.flush();
        }
    }

    /**
     * Executes the asynchronous persistence of queued metrics.
     * @param {boolean} force - If true, ignores the isFlushing lock (used during startup/shutdown).
     */
    async flush(force = false) {
        if (this.logQueue.length === 0 || (this.isFlushing && !force)) {
            return;
        }

        this.isFlushing = true;
        
        // Atomically grab the current queue entries
        const entriesToFlush = this.logQueue;
        this.logQueue = [];

        try {
            await this.adapter.write(entriesToFlush);
            this.emit('flushSuccess', { count: entriesToFlush.length });
        } catch (error) {
            CORE_LOGGER.error('MAL: Data persistence failure during flush.', { 
                error: error.message, 
                targetAdapter: this.adapter.constructor.name,
                count: entriesToFlush.length 
            });
            
            // Re-queue failed entries for resilience
            if (this.config.suppressInternalErrors || force) {
                this.logQueue.unshift(...entriesToFlush);
            }
            
            this.emit('flushFailure', { error, count: entriesToFlush.length });
            
        } finally {
            this.isFlushing = false;
        }
    }
}

module.exports = { MetricsAuditLogger, DEFAULT_CONFIG };