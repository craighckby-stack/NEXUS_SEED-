/**
 * RESOURCE CHECK REGISTRY KERNEL (RCRK)
 * ID: RCRK-G01
 * GSEP Role: Centralized store and execution manager for standardized resource checks.
 *
 * The RCRK provides a formal interface for defining new environmental prerequisites,
 * decoupling the specifics of resource measurement (like memory usage or latency)
 * from the main Resource Attestation Module (RAM) governance flow.
 */

// --- JSDoc Definitions ---

/**
 * @typedef {Object} CheckResult
 * @property {boolean} success - True if the check passed (i.e., resources are sufficient).
 * @property {Object} [details] - Measurement data or information about the threshold violation.
 */

/**
 * @typedef {Object} CheckExecutionResult
 * @property {string} check - The ID of the check run.
 * @property {string} status - The execution status (PASS, FAIL, ERROR).
 * @property {boolean} success - Final boolean indicator (false if FAIL or ERROR).
 * @property {Object} details - Measurement details, error message, or stack trace.
 */

/**
 * @callback ResourceCheckFunction
 * @param {Object} monitor - The system monitoring dependency (e.g., EnvironmentMonitor).
 * @param {Object} governanceConfig - Global governance configuration baselines (e.g., standard thresholds).
 * @param {Object} payloadMetadata - Requirements specific to the current mutation or operation payload.
 * @returns {Promise<CheckResult>}
 */

const CHECK_STATUS = Object.freeze({
    PASS: 'PASS',
    FAIL: 'FAIL',
    ERROR: 'ERROR', // Indicates an internal execution failure of the check function itself.
});

/**
 * Manages and executes resource prerequisite checks, leveraging injected tools for execution standardization and logging.
 */
class ResourceCheckRegistryKernel {
    
    /**
     * @param {IAsyncCheckExecutionWrapperToolKernel} asyncExecutionWrapperToolKernel - Executes and standardizes check results.
     * @param {ILoggerToolKernel} loggerToolKernel - Standardized logging interface.
     */
    constructor(asyncExecutionWrapperToolKernel, loggerToolKernel) {
        /** @type {Map<string, ResourceCheckFunction>} */
        this.checks = new Map();
        this.STATUS = CHECK_STATUS;
        this.asyncExecutionWrapper = asyncExecutionWrapperToolKernel;
        this.logger = loggerToolKernel;
        
        this.#setupDependencies();
    }

    /**
     * Synchronously validates required dependencies.
     * @private
     */
    #setupDependencies() {
        if (!this.asyncExecutionWrapper || typeof this.asyncExecutionWrapper.execute !== 'function') {
            throw new Error("RCRK-D01: IAsyncCheckExecutionWrapperToolKernel dependency is required and must implement 'execute'.");
        }
        if (!this.logger || typeof this.logger.warn !== 'function' || typeof this.logger.error !== 'function') {
            throw new Error("RCRK-D02: ILoggerToolKernel dependency is required.");
        }
    }

    /**
     * Asynchronously initializes the kernel.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Adheres to the mandate for high-integrity kernel initialization.
    }

    /**
     * Registers a new check function under a unique identifier.
     * Throws an error if the function is invalid. Logs a warning if overwriting.
     * @param {string} id - Unique identifier for the check (e.g., 'CORE_CPU_BASELINE').
     * @param {ResourceCheckFunction} checkFn - The function defining the resource verification logic.
     */
    registerCheck(id, checkFn) {
        if (typeof checkFn !== 'function') {
            this.logger.error(`RCRK-E01: Check function for ID ${id} must be a function.`);
            throw new TypeError(`RCRK-E01: Check function for ID ${id} must be a function.`);
        }
        if (this.checks.has(id)) {
            this.logger.warn(`RCRK-W01: Check ID ${id} already registered. Overwriting definition.`);
        }
        this.checks.set(id, checkFn);
    }

    /**
     * Retrieves a specific check function.
     * @param {string} id - The check identifier.
     * @returns {ResourceCheckFunction | undefined}
     */
    getCheck(id) {
        return this.checks.get(id);
    }

    /**
     * Executes all registered checks concurrently, providing necessary context.
     * 
     * @param {Object} monitor - System monitoring dependency.
     * @param {Object} governanceConfig - Baseline configuration.
     * @param {Object} payloadMetadata - Mutation-specific requirements.
     * @returns {Promise<CheckExecutionResult[]>} A promise resolving to an array of standardized check results.
     */
    async runAllChecks(monitor, governanceConfig, payloadMetadata) {
        const checkPromises = [];
        const args = [monitor, governanceConfig, payloadMetadata];

        for (const [id, checkFn] of this.checks.entries()) {
            
            // Delegation of execution, error handling, and result standardization to the specialized wrapper tool kernel
            const runnerPromise = this.asyncExecutionWrapper.execute(
                checkFn, 
                id, 
                args,
                this.STATUS
            );
            checkPromises.push(runnerPromise);
        }
        
        // Execute all checks concurrently and wait for all results
        return Promise.all(checkPromises);
    }
}

module.exports = ResourceCheckRegistryKernel;