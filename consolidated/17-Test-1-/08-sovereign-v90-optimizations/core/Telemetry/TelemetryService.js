/**
 * TelemetryService (GAX v94.2)
 * Handles initialization, formatting, sampling, and decoupled asynchronous publishing 
 * of events to the central telemetry endpoint via a dedicated transport layer.
 */

const GAXEventRegistry = require('./GAXEventRegistry');
const TelemetryTransport = require('./TelemetryTransport'); 
const TelemetrySampler = require('./TelemetrySampler');   

// AGI-KERNEL PLUGIN INTEGRATION:
// EventPreflightValidator is used to enforce critical prerequisites (initialization, registration).
const EventPreflightValidator = require('AGI-CORE/plugins/EventPreflightValidator');

const SETUP_ERROR_PREFIX = '[TelemetryService Setup]';

class TelemetryService {
    #isInitialized = false;
    #config = {};
    #transport = null;
    #sampler = null;

    /**
     * Handles internal faults occurring within the telemetry mechanism itself, 
     * preventing recursion and ensuring critical debugging info is logged locally.
     * @param {string} faultName 
     * @param {object} details 
     */
    #handleInternalFault(faultName, details) {
        const fullDetails = { faultName, timestamp: Date.now(), details };
        // Use console.error for critical internal faults since the publish pipeline cannot be trusted.
        console.error(`[Telemetry Internal Fault: ${faultName}]`, fullDetails);
    }
    
    /**
     * Synchronously initializes and validates core dependencies (Transport and Sampler).
     * @param {object} config 
     * @returns {{transport: TelemetryTransport, sampler: TelemetrySampler}}
     */
    #setupDependencies(config) {
        try {
            const transport = new TelemetryTransport(config);
            const sampler = new TelemetrySampler(config.samplingRates || {});
            return { transport, sampler };
        } catch (e) {
            // Re-throw standardized error during initialization
            throw new Error(`${SETUP_ERROR_PREFIX} Dependency initialization failed: ${e.message}`);
        }
    }

    /**
     * Proxies the event to the asynchronous transport layer and handles immediate transport faults.
     * This acts as an I/O proxy for external communication delegation.
     * @param {object} telemetryPacket - The fully formed event packet.
     * @param {string} eventName - The original event name for fault logging.
     */
    #delegateToTransport(telemetryPacket, eventName) {
        try {
            // The transport handles the actual asynchronous send/retry logic
            this.#transport.queueEvent(telemetryPacket);
        } catch (error) {
            // Log transport failure internally, avoiding recursion
            this.#handleInternalFault('TEL_PUBLISH_FAILURE', { event: eventName, transportError: error.message });
        }
    }

    /**
     * Initializes the service with necessary configuration (e.g., endpoint, sampling rates).
     * @param {object} config - Telemetry configuration { endpoint, systemId, samplingRates, batchSize }
     */
    initialize(config) {
        if (this.#isInitialized) {
            console.warn(`${SETUP_ERROR_PREFIX} Service already initialized.`);
            return;
        }

        if (!config || !config.systemId || !config.endpoint) {
             throw new Error(`${SETUP_ERROR_PREFIX} Initialization failed: Must provide systemId and endpoint.`);
        }

        this.#config = config;
        
        // Initialize supporting components (dependency injection)
        const { transport, sampler } = this.#setupDependencies(config);
        this.#transport = transport;
        this.#sampler = sampler;

        this.#isInitialized = true;
        console.log(`TelemetryService initialized for system ${config.systemId}. Endpoint: ${config.endpoint}`);
    }

    /**
     * Publishes a structured event to the telemetry pipeline.
     * @param {string} eventName - Must be a key from GAXEventRegistry values
     * @param {object} payload - Contextual data related to the event
     */
    publish(eventName, payload = {}) { 
        
        // Check initialization state explicitly, ensuring all necessary components are ready.
        const fullyInitialized = this.#isInitialized && !!this.#transport && !!this.#sampler;

        // 0. Precondition Check using the abstracted Validator
        const validationResult = EventPreflightValidator.execute({
            eventName: eventName,
            isInitialized: fullyInitialized,
            eventRegistry: GAXEventRegistry 
        });

        if (!validationResult.isValid) {
            this.#handleInternalFault(
                validationResult.faultName, 
                validationResult.details || { attemptedEvent: eventName }
            );
            return;
        }

        // 2. Sampling Check
        if (!this.#sampler.shouldSample(eventName)) {
            return; // Event dropped due to sampling policy
        }

        // 3. Packet Construction (using minimized keys for data efficiency)
        const telemetryPacket = {
            ts: Date.now(), 
            sid: this.#config.systemId,
            e: eventName,
            d: payload 
        };
        
        // 4. Transport Delegation (Queueing/Batching)
        this.#delegateToTransport(telemetryPacket, eventName);
    }
}

// Export a singleton instance, requiring explicit initialization via the initialize method
module.exports = new TelemetryService();