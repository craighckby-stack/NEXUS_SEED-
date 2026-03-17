/**
 * core/system/IsolatedFailureReporter.js
 * 
 * Handles safe, asynchronous reporting of system failures, ensuring that the
 * reporting mechanism itself cannot cause cascade failures or block the main thread.
 */
class IsolatedFailureReporter {
    #transport;
    #serializer;

    /**
     * Initializes the reporter. Requires the ErrorSerializer dependency
     * (or equivalent class with a static safeSerialize method) and a transport function.
     *
     * @param {function(Object): Promise<void>} transportFunction - Function responsible for sending the serialized data (e.g., an HTTP post).
     * @param {Class} ErrorSerializerClass - The dependency for serialization (expected to have a static safeSerialize method).
     */
    constructor(transportFunction, ErrorSerializerClass) {
        this.#setupDependencies(transportFunction, ErrorSerializerClass);
    }

    /**
     * Extracts dependency assignment and validation, storing dependencies privately.
     * (Strategic Goal: Dependency Encapsulation & Synchronous Setup Extraction)
     * 
     * @param {function(Object): Promise<void>} transportFunction 
     * @param {Class} ErrorSerializerClass 
     */
    #setupDependencies(transportFunction, ErrorSerializerClass) {
        // Optimization: Standardize validation errors to TypeError for invalid input types/shapes.
        if (typeof transportFunction !== 'function') {
            throw new TypeError("IsolatedFailureReporter requires a valid transport function (must be a function).");
        }
        if (!ErrorSerializerClass || typeof ErrorSerializerClass.safeSerialize !== 'function') {
            throw new TypeError("IsolatedFailureReporter requires a valid ErrorSerializer plugin dependency (must expose static safeSerialize).");
        }
        
        this.#transport = transportFunction;
        this.#serializer = ErrorSerializerClass;
    }

    /**
     * Isolates the synchronous interaction with the external serializer dependency. 
     * (Strategic Goal: I/O Proxy Creation)
     *
     * @param {Error|*} error 
     * @param {Object} context 
     * @returns {Object} The serialized payload.
     */
    #delegateToSerializer(error, context) {
        return this.#serializer.safeSerialize(error, context);
    }

    /**
     * Isolates the asynchronous interaction (I/O) with the external transport dependency. 
     * (Strategic Goal: I/O Proxy Creation)
     *
     * @param {Object} payload 
     * @returns {Promise<void>}
     */
    async #delegateToTransport(payload) {
        return this.#transport(payload);
    }

    /**
     * Reports a failure. This operation is guaranteed to be isolated using a
     * microtask break (Promise.resolve()), ensuring it does not block the caller.
     * 
     * @param {Error|*} error - The error object or exception encountered.
     * @param {Object} [context={}] - Additional data relevant to the error location.
     */
    async report(error, context = {}) {
        // Use a microtask break to ensure the reporting mechanism is executed
        // asynchronously and doesn't block the caller, fulfilling the "Isolated" requirement.
        await Promise.resolve();

        try {
            // Utilize the synchronous I/O proxy for safe data packaging
            const failurePayload = this.#delegateToSerializer(error, context);
            
            // Execute transport asynchronously via I/O proxy
            await this.#delegateToTransport(failurePayload);

        } catch (transportError) {
            // CRITICAL: If the transport mechanism fails, we must catch and log internally.
            // We must not throw, as this would violate the isolation guarantee and potentially
            // cause a failure cascade where reporting itself becomes a source of errors.
            console.error(`[IsolatedFailureReporter] Transport failed during error reporting of ${error?.name || 'unknown error'}:`, transportError);
        }
    }
}