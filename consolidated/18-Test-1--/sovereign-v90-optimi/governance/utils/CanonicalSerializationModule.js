/**
 * governance/utils/CanonicalSerializationModule.js
 * Optimized Canonical Serialization Module leveraging the DeterministicSerializer plugin.
 */

class CanonicalSerializationModuleImpl {
    #serializerInstance;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Extracts synchronous dependency resolution and initialization logic.
     */
    #setupDependencies() {
        try {
            // 1. Resolve the dependency synchronously (I/O Proxy)
            const Serializer = this.#resolveDeterministicSerializerDependency();
            
            // 2. Instantiate the tool
            this.#serializerInstance = new Serializer();
        } catch (error) {
            this.#throwDependencyError("DeterministicSerializer initialization failed.", error);
        }
    }

    /**
     * I/O Proxy: Isolates the synchronous dependency retrieval (require).
     */
    #resolveDeterministicSerializerDependency() {
        // Assuming plugins are stored here as per original source structure
        // NOTE: This is inherently synchronous I/O via the module loader.
        return require('./plugins/DeterministicSerializer'); 
    }

    /**
     * I/O Proxy: Isolates error throwing.
     */
    #throwDependencyError(message, cause) {
        throw new Error(`[CanonicalSerializationModule Setup Error] ${message}`, { cause });
    }

    /**
     * I/O Proxy: Isolates external dependency execution.
     * @param {*} data 
     * @returns {string | undefined}
     */
    #delegateToSerializerExecution(data) {
        // Original logic check: if input is undefined, return undefined.
        if (data === undefined) {
            return undefined;
        }
        
        // Execute the external tool method
        return this.#serializerInstance.serialize(data);
    }

    /**
     * Serializes data into a canonical JSON string.
     * Ensures deterministic output crucial for hashing or signing.
     * @param {*} data 
     * @returns {string | undefined} The canonical JSON string, or undefined if the input is undefined.
     */
    canonicalSerialize(data) {
        return this.#delegateToSerializerExecution(data);
    }
}

// Use a private singleton instance to maintain state and control initialization.
const instance = new CanonicalSerializationModuleImpl();

module.exports = {
    canonicalSerialize: instance.canonicalSerialize.bind(instance),
};
