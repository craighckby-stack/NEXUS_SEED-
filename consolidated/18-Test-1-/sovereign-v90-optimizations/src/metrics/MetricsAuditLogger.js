declare const ResilientQueueFactory: any;

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

// Helper type definition based on the plugin interface
type ResilientQueue = {
    start: () => void;
    stop: () => void;
    push: (item: any) => boolean;
    process: (force?: boolean) => Promise<number>;
    getQueueLength: () => number;
};

/**
 * Metrics Audit Logger (MAL) v94.1 - Autonomous Code Evolution Module
 * Provides a standardized interface for persistent logging of critical decision metrics.
 * It uses time-based or size-based triggers for asynchronous flushing via a stream adapter.
 *
 * Requirements for streamAdapter: Must implement write(entries: Array<AuditEntry>): Promise<void>
 */
class MetricsAuditLogger extends EventEmitter {
    private adapter: any;
    private processor: ResilientQueue;
    public config: typeof DEFAULT_CONFIG;

    /**
     * @param {object} streamAdapter - Must implement write(entries: Array<AuditEntry>): Promise<void>.
     * @param {object} config - Overrides for DEFAULT_CONFIG.
     */
    constructor(streamAdapter: any, config: any = {}) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        if (!streamAdapter || typeof streamAdapter.write !== 'function') {
            throw new Error("MetricsAuditLogger requires a streamAdapter with a 'write(data)' method signature.");
        }
        
        this.adapter = streamAdapter; 
        
        // 1. Define the batch processing function (wraps adapter.write)
        const processBatch = async (entries: any[]) => {
            await this.adapter.write(entries);
            
            // Success event handling
            this.emit('flushSuccess', { 
                count: entries.length, 
                adapter: this.adapter.constructor?.name || 'UnknownAdapter' 
            });
        };
        
        // 2. Initialize the ResilientQueueFactory plugin
        this.processor = ResilientQueueFactory.create({
            processBatch: processBatch,
            intervalMs: this.config.flushIntervalMs,
            maxSize: this.config.maxQueueSize,
            suppressErrors: this.config.suppressInternalErrors,
            logger: CORE_LOGGER 
        });
        
        this.start();
    }
    
    /** 
     * Initializes periodic flushing timer and starts the logger loop. 
     */
    start() {
        // Start the processor's internal timing loop
        this.processor.start();
        CORE_LOGGER.info('MAL started.', { flushInterval: this.config.flushIntervalMs });
    }

    /** 
     * Clears the timer and executes a final, forced flush, ensuring clean shutdown. 
     */
    async shutdown() {
        if (this.processor.getQueueLength() === 0) {
            CORE_LOGGER.info('MAL shutting down (queue empty).');
            this.processor.stop();
            return Promise.resolve();
        }
        
        CORE_LOGGER.info('MAL shutting down...');
        this.processor.stop(); // Stop timers immediately
        
        try {
            // Force flush remaining data, ignoring state locks
            await this.processor.process(true); 
            this.emit('shutdownComplete');
        } catch (e) {
            const queueLength = this.processor.getQueueLength();
            CORE_LOGGER.error('MAL Shutdown failed during final flush.', { 
                error: (e as Error).message, 
                queueSize: queueLength // Items re-queued due to final failure
            });
        }
    }

    /**
     * Logs a specific metric event for auditing.
     * @param {string} metricType - Defines the class of metric (e.g., 'CALIBRATION', 'EXECUTION').
     * @param {object} data - The payload containing context, inputs, and outputs.
     */
    log(metricType: string, data: any) {
        
        const entry = {
            timestamp: new Date().toISOString(),
            metricType,
            data
        };
        
        const pushed = this.processor.push(entry);
        
        if (pushed) {
            this.emit('metricLogged', entry);
        } else {
            // Push returns false if the queue processor is stopped.
            this.emit('metricDropped', { reason: 'Logger stopped', metricType });
        }
    }

    /**
     * Executes the asynchronous persistence of queued metrics.
     * @param {boolean} force - If true, ignores the flushing state lock.
     */
    async flush(force = false) {
        try {
            // The processor handles checking queue size, locking, atomic swap, and success event trigger.
            await this.processor.process(force);
        } catch (error) {
            // Catch errors re-thrown by the processor (persistence failure)
            
            // Resilience: the plugin has already re-queued the items if suppressInternalErrors is true.
            const countOfRequeued = this.processor.getQueueLength();
            
            // Log top-level context for the adapter failure
            const adapterName = this.adapter.constructor?.name || 'UnknownAdapter';
            CORE_LOGGER.error('MAL Flush Failure: Persistence mechanism reported an error.', { 
                error: (error as Error).message, 
                targetAdapter: adapterName,
                count: countOfRequeued,
                isForced: force
            });

            this.emit('flushFailure', { error, count: countOfRequeued });
        }
    }
}

module.exports = { MetricsAuditLogger, DEFAULT_CONFIG };