// Sovereign AGI v7.4.4 - RIMP Integrity Verifier Engine
// This module utilizes the prioritized baseline snapshot to perform intelligent, tiered integrity checks.
// Refactored for scalability and better asynchronous dependency management (Cycle 1: Hash Abstraction).

// NOTE: Assumes ContextualLogger is available, either required or globally registered in the AGI-KERNEL environment.

const RIMP_STATUS = {
    MODIFIED: 'MODIFIED',
    OK: 'OK',
    ERROR: 'ERROR_READ'
};

class IntegrityVerifierEngine {
    #baseline;
    #hashAlgorithm;
    #verifierId;
    #contextualLogger;
    #integrityHasher;
    #componentKeys;

    /**
     * @param {Object} baselineConfig - Configuration including components, priority, and algorithm.
     * @param {Object} environmentServices - Simulated environment services (fs, crypto, logger, integrityHasher).
     */
    constructor(baselineConfig, environmentServices = {}) {
        this.#initializeEngine(baselineConfig, environmentServices);
    }

    /**
     * Performs synchronous initialization and dependency resolution.
     * @param {Object} baselineConfig 
     * @param {Object} environmentServices 
     */
    #initializeEngine(baselineConfig, environmentServices) {
        this.#baseline = baselineConfig;
        this.#hashAlgorithm = baselineConfig.algorithm || 'SHA256';
        this.#verifierId = baselineConfig.snapshotId;
        
        // Initialize Contextual Logger plugin
        this.#contextualLogger = new ContextualLogger(`RIMP::${this.#verifierId}`, environmentServices.logger);

        // Dependency Injection for external tools
        this.#integrityHasher = environmentServices.integrityHasher || null;

        // Sorting keys upfront based on descending priority for efficient iteration
        this.#componentKeys = Object.keys(baselineConfig.components).sort((a, b) => 
            baselineConfig.components[b].priority - baselineConfig.components[a].priority
        );

        if (!this.#integrityHasher) {
             this.#logWarn('Integrity Hash calculation tool not provided. Scan will proceed but requires external injection for functionality.');
        }

        this.#logInfo(`Initialized RIMP Engine ${this.#verifierId} using ${this.#hashAlgorithm}.`);
    }

    /**
     * Delegates the asynchronous execution request to the external IntegrityHasher tool.
     * @param {string} path 
     * @returns {Promise<string>} The calculated hash.
     */
    async #delegateToIntegrityHasherExecution(path) {
        if (!this.#integrityHasher) {
            throw new Error('IntegrityHasher dependency is missing.');
        }
        // Call the injected external hasher tool
        return await this.#integrityHasher.execute({
            path: path,
            algorithm: this.#hashAlgorithm
        }); 
    }

    // --- Logging Proxies ---
    #logInfo(message) {
        if (this.#contextualLogger) this.#contextualLogger.info(message);
    }
    #logWarn(message) {
        if (this.#contextualLogger) this.#contextualLogger.warn(message);
    }
    #logError(message) {
        if (this.#contextualLogger) this.#contextualLogger.error(message);
    }
    #logDebug(message) {
        if (this.#contextualLogger) this.#contextualLogger.debug(message);
    }
    // -----------------------

    /**
     * Executes the integrity scan.
     * Optimized: Uses Promise.all for concurrent hashing, significantly reducing I/O wait time.
     * @param {number} maxPriority - Only components with priority <= this value are checked.
     * @param {boolean} differential - If true, only reports MODIFIED/ERROR results.
     * @returns {Promise<Object>} Results map.
     */
    async executeScan(maxPriority, differential = false) {
        if (!this.#integrityHasher) {
             this.#logError('Cannot execute scan: Integrity Hash calculation tool is missing.');
             throw new Error('Missing IntegrityHasher dependency.');
        }

        this.#logInfo(`Starting Integrity Scan (Max P: ${maxPriority}, Differential: ${differential}). Executing concurrent hashing.`);
        
        const tasks = [];
        
        // 1. Collect all paths that need verification based on priority
        for (const key of this.#componentKeys) {
            const component = this.#baseline.components[key];
            if (component.priority <= maxPriority) {
                this.#logDebug(`Queueing component paths: ${key} (P: ${component.priority})`);
                for (const [path, expectedHash] of Object.entries(component.hashes)) {
                    tasks.push({ path, expectedHash });
                }
            }
        }

        // 2. Define the concurrent processing function
        const processTask = async ({ path, expectedHash }) => {
            let currentHash;
            let status;
            let resultDetails = {};

            try {
                // Delegate I/O operation
                currentHash = await this.#delegateToIntegrityHasherExecution(path);
                
                if (currentHash !== expectedHash) {
                    status = RIMP_STATUS.MODIFIED;
                    resultDetails = { current: currentHash, expected: expectedHash };
                    this.#logWarn(`Integrity breach detected: ${path}`);
                } else {
                    status = RIMP_STATUS.OK;
                }
            } catch (error) {
                status = RIMP_STATUS.ERROR;
                resultDetails = { detail: error.message };
                this.#logError(`Error reading file ${path}: ${error.message}`);
            }

            // Return the full result object, or null if OK and differential mode is active
            if (status !== RIMP_STATUS.OK || !differential) {
                return { path, status, ...resultDetails };
            }
            return null;
        };

        // 3. Execute all tasks concurrently
        const taskPromises = tasks.map(processTask);
        const rawResults = await Promise.all(taskPromises);

        // 4. Aggregate and filter results
        const results = {};
        let issuesCount = 0;

        for (const result of rawResults) {
            if (result) {
                const { path, status, ...details } = result;
                results[path] = { status, ...details };
                if (status !== RIMP_STATUS.OK) {
                    issuesCount++;
                }
            }
        }
        
        this.#logInfo(`Scan complete. Processed ${tasks.length} files. Found ${issuesCount} integrity issues.`);
        return results;
    }
}

module.exports = IntegrityVerifierEngine;