/**
 * FailureTraceLogger_Service
 * Handles cryptographic certification and immutable storage for Failure Trace Logs (FTLs),
 * relying on canonical JSON serialization for guaranteed cryptographic integrity.
 */

class FailureTraceLogger_Service {
    // Private fields enforce strict encapsulation for critical dependencies.
    #serializer;
    #certifier;
    #storage;

    /**
     * @param {object} serializer - The plugin used for canonical JSON serialization.
     * @param {object} certifier - The cryptographic signing module.
     * @param {object} storage - The immutable storage connector.
     */
    constructor(serializer, certifier, storage) {
        this.#setupDependencies(serializer, certifier, storage);
    }

    /**
     * Handles synchronous dependency validation and assignment.
     * @param {object} serializer 
     * @param {object} certifier 
     * @param {object} storage 
     */
    #setupDependencies(serializer, certifier, storage) {
        // Enforce explicit dependency injection contract
        if (!serializer || !certifier || !storage) {
            throw new Error("FailureTraceLogger_Service requires all three dependencies (serializer, certifier, storage) to be explicitly injected.");
        }
        
        // Robustness Check: Ensure dependencies expose required methods.
        if (typeof serializer.serialize !== 'function') throw new Error("Serializer dependency missing required 'serialize' method.");
        if (typeof certifier.sign !== 'function') throw new Error("Certifier dependency missing required 'sign' method.");
        if (typeof storage.store !== 'function') throw new Error("Storage dependency missing required 'store' method.");

        this.#serializer = serializer; 
        this.#certifier = certifier;   
        this.#storage = storage;
    }

    /**
     * Delegates synchronous serialization to the external plugin.
     * @param {object} traceData - The raw failure trace object.
     * @returns {string} The canonical JSON string.
     */
    #delegateToSerializer(traceData) {
        return this.#serializer.serialize(traceData);
    }

    /**
     * Delegates asynchronous signing/certification to the external plugin.
     * Optimization: Removed redundant 'async/await'. Returns the promise directly.
     * @param {string} canonicalTrace - The deterministic JSON string.
     * @returns {Promise<string>} The certified log data.
     */
    #delegateToCertifier(canonicalTrace) {
        return this.#certifier.sign(canonicalTrace);
    }

    /**
     * Delegates asynchronous immutable storage operation to the external connector.
     * Optimization: Removed redundant 'async/await'. Returns the promise directly.
     * @param {string} certifiedLog - The certified log data.
     * @returns {Promise<object>} The storage receipt.
     */
    #delegateToStorage(certifiedLog) {
        return this.#storage.store(certifiedLog);
    }

    /**
     * Processes, certifies, and immutably stores a failure trace log (FTL).
     * @param {object} traceData - The raw failure trace object.
     * @returns {Promise<object>} The receipt and certification details.
     */
    async logFailure(traceData) {
        if (!traceData || typeof traceData !== 'object') {
            throw new Error("Invalid trace data provided for logging: Must be a non-null object.");
        }

        // 1. Canonical JSON Serialization
        const canonicalTrace = this.#delegateToSerializer(traceData);

        // 2. Cryptographic Certification
        const certifiedLog = await this.#delegateToCertifier(canonicalTrace);

        // 3. Immutable Storage Connection
        const storageReceipt = await this.#delegateToStorage(certifiedLog);

        return {
            storageReceipt: storageReceipt,
            certifiedLogSegment: certifiedLog.substring(0, 50) + '...'
        };
    }
}