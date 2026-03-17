/**
 * Interface for the Asynchronous Queue Writer Tool.
 * @interface ISerializedAsyncQueueWriterToolKernel
 */

/**
 * Interface for the standardized logging service.
 * @interface ILoggerToolKernel
 */

/**
 * DecisionAuditLoggerKernel
 * Records all OGT adjudication results asynchronously and immutably.
 * All I/O handling is delegated to the specialized queueWriter tool.
 */
class DecisionAuditLoggerKernel {
    /**
     * @param {object} dependencies - Injected dependencies.
     * @param {ISerializedAsyncQueueWriterToolKernel} dependencies.queueWriter - The asynchronous queue writer tool, pre-configured with batching/flush settings.
     * @param {string} dependencies.filePath - Resolved path to the audit log file.
     * @param {ILoggerToolKernel} dependencies.logger - Logging tool.
     */
    constructor(dependencies) {
        this.queueWriter = dependencies.queueWriter;
        this.filePath = dependencies.filePath;
        this.logger = dependencies.logger;
        this.isInitialized = false;
        
        this.#setupDependencies();
    }

    /**
     * Internal dependency setup and validation.
     * Rigorously satisfies synchronous setup extraction.
     */
    #setupDependencies() {
        if (!this.queueWriter || typeof this.filePath !== 'string' || !this.filePath || !this.logger) {
            throw new Error("DecisionAuditLoggerKernel requires queueWriter, a valid filePath string, and logger dependencies.");
        }
    }

    /**
     * Initializes the logger by opening the underlying file stream.
     */
    init() {
        if (this.isInitialized) {
            this.logger.warn("DecisionAuditLoggerKernel already initialized.");
            return;
        }
        
        this.queueWriter.init(this.filePath);
        this.isInitialized = true;
    }

    /**
     * Logs a single OGT decision adjudication result.
     * 
     * @param {object} decisionData - The immutable data object representing the decision result.
     */
    logDecision(decisionData) {
        if (!this.isInitialized) {
            this.logger.warn("Attempted to log decision before logger was initialized.");
            return;
        }

        try {
            // Domain-specific task: Formatting the object into a JSON Line
            const logLine = JSON.stringify(decisionData) + '\n';
            
            // Delegate I/O to the specialized writer
            this.queueWriter.write(logLine);
        } catch (error) {
            this.logger.error("Failed to serialize decision data for logging:", error, decisionData);
        }
    }

    /**
     * Flushes all pending audit records to disk and closes the underlying file stream.
     * @returns {Promise<void>}
     */
    async flush() {
        if (!this.isInitialized) return;
        this.logger.info("DecisionAuditLoggerKernel commencing graceful flush...");
        await this.queueWriter.flush();
        this.isInitialized = false;
    }
}

module.exports = { DecisionAuditLoggerKernel };