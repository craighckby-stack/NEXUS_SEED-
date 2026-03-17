/**
 * Component ID: D-01 (Decision Audit Logger)
 * Decision Audit Logger: Asynchronously and immutably records all OGT adjudication results 
 * using a buffered, batched, and serialized disk write queue (JSON Lines format).
 *
 * Refactoring Rationale:
 * 1. Converted hardcoded constants to configurable defaults, enabling Dependency Injection (e.g., from C-01).
 * 2. Introduced a `maxRetries` mechanism. If persistent disk IO fails, logs are eventually dropped after retries to prevent system deadlock/infinite blocking.
 * 3. Added safety limits to the `flush()` operation to ensure graceful shutdown doesn't hang indefinitely.
 * 4. Improved clarity in queue management (`_processQueue`) by moving failure/success handling to the try/catch blocks.
 */

const fs = require('fs/promises');
const path = require('path');

// Sensible defaults for independent operation, configurable via constructor
const DEFAULT_CONFIG = {
    logDir: path.join(__dirname, '../../logs'),
    fileName: 'ogt_decisions.jsonl',
    batchSize: 50,
    flushIntervalMs: 5000,
    maxRetries: 3 // Maximum consecutive attempts before discarding a batch on write failure
};

class DecisionAuditLogger {
    /**
     * @param {object} config - Configuration options (e.g., logDir, batchSize).
     */
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.auditPath = path.join(this.config.logDir, this.config.fileName);
        
        this.initialized = false;
        this.initializationPromise = null;
        this.writeQueue = [];
        this.isProcessing = false;
        this.flushInterval = null;
        this.consecutiveFailures = 0;
    }

    /**
     * Ensures the log directory exists and prepares the logger. Must be awaited once.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = (async () => {
            const dir = path.dirname(this.auditPath);
            try {
                await fs.mkdir(dir, { recursive: true });
                this.initialized = true;
                
                // Start safety interval
                this.flushInterval = setInterval(() => this._processQueue(), this.config.flushIntervalMs);
                this.flushInterval.unref(); 

                console.log(`[D-01] Decision Audit Logger initialized. Path: ${this.auditPath}`);
            } catch (error) {
                console.error(`[D-01 CRITICAL ERROR] Failed to initialize audit log directory at ${dir}: ${error.message}`);
                throw error;
            }
        })();
        return this.initializationPromise;
    }

    /**
     * @private
     * Handles draining the write queue and performing disk IO in serialized batches.
     */
    async _processQueue() {
        if (!this.initialized || this.isProcessing || this.writeQueue.length === 0) {
            return;
        }

        this.isProcessing = true;
        
        // Take a batch off the queue using slice (non-destructive read)
        const batch = this.writeQueue.slice(0, this.config.batchSize);
        
        if (batch.length === 0) {
            this.isProcessing = false;
            return;
        }

        try {
            const dataToWrite = batch.join(''); 
            await fs.appendFile(this.auditPath, dataToWrite, 'utf8');

            // Success: Remove the written batch from the queue and reset failure counter
            this.writeQueue.splice(0, batch.length);
            this.consecutiveFailures = 0;

        } catch (error) {
            this.consecutiveFailures++;
            console.error(`[D-01 CRITICAL WRITE FAIL] Attempt ${this.consecutiveFailures}. Failed to write batch of ${batch.length} logs. Error: ${error.message}`);
            
            // Retry limit check: If failure persists, drop the data to maintain system stability.
            if (this.consecutiveFailures >= this.config.maxRetries) {
                console.warn(`[D-01 DATA LOSS ALERT] Max retries (${this.config.maxRetries}) hit. Dropping ${batch.length} log entries to unblock queue.`);
                this.writeQueue.splice(0, batch.length); // Discard failed batch
                this.consecutiveFailures = 0; // Reset after forced discard
            }
            
        } finally {
            this.isProcessing = false;
            // Schedule the next check immediately if there is more work to do
            if (this.writeQueue.length > 0) {
                setImmediate(() => this._processQueue());
            }
        }
    }

    /**
     * Logs a completed OGT decision asynchronously by queuing it.
     * The call resolves instantly, decoupling logging from slow disk IO.
     * @param {object} decisionPayload - Data structure containing OGT outputs.
     * @returns {Promise<void>}
     */
    async logDecision(decisionPayload) {
        // Robust initialization check: ensure we await initialization if pending
        if (!this.initialized && this.initializationPromise) {
            await this.initializationPromise;
        } else if (!this.initialized) {
             await this.initialize(); // Lazy initialization safety check
        }

        if (!decisionPayload.timestamp) {
            decisionPayload.timestamp = Date.now();
        }
        
        // 1. Convert payload to JSON Lines format (fast synchronous operation)
        const logEntry = JSON.stringify(decisionPayload) + '\n';
        
        // 2. Add to the queue
        this.writeQueue.push(logEntry);

        // 3. Trigger processing if not currently running
        if (!this.isProcessing) {
             // Use setImmediate to schedule IO handling outside the current call stack
             setImmediate(() => this._processQueue());
        }
    }

    /**
     * Mandatory graceful shutdown method. Awaits until the queue is empty.
     * @returns {Promise<void>}
     */
    async flush() {
        this.dispose(); // Stop the periodic safety flush
        console.log(`[D-01] Starting graceful audit log flush (${this.writeQueue.length} pending entries)...`);
        
        const MAX_FLUSH_ITERATIONS = 5000; 
        let iterations = 0;

        // Continuously process queue until empty and the processing cycle completes
        while ((this.writeQueue.length > 0 || this.isProcessing) && iterations < MAX_FLUSH_ITERATIONS) {
            await this._processQueue();
            if (this.writeQueue.length > 0 || this.isProcessing) {
                // Yield briefly
                await new Promise(resolve => setTimeout(resolve, 5)); 
            }
            iterations++;
        }
        
        if (this.writeQueue.length > 0) {
             console.error(`[D-01 CRITICAL FLUSH FAILURE] Failed to empty queue after ${MAX_FLUSH_ITERATIONS} iterations. ${this.writeQueue.length} entries remain. Data potentially lost.`);
        } else {
            console.log('[D-01] Audit log flush complete.');
        }
    }
    
    /**
     * Cleans up internal timers.
     */
    dispose() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
            console.log('[D-01] Safety flush interval disabled.');
        }
    }
}

module.exports = DecisionAuditLogger;