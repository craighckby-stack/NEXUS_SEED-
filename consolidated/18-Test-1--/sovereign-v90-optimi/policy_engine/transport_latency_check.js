/**
 * AGI-KERNEL Component: TransportLatencyPolicyKernel
 * Encapsulates the logic for checking and validating transport latency
 * against mandated thresholds, strictly enforcing architectural separation.
 */
class TransportLatencyPolicyKernel {
    #config;
    #telemetryService;

    /**
     * @param {object} config - Configuration object containing maxLatencyMs.
     * @param {object} telemetryService - External service providing latency data.
     */
    constructor(config, telemetryService) {
        this.#setupDependencies(config, telemetryService);
    }

    /**
     * Private method to handle synchronous dependency resolution and validation.
     * Satisfies the Synchronous Setup Extraction Goal.
     */
    #setupDependencies(config, telemetryService) {
        if (!config || typeof config.maxLatencyMs !== 'number' || config.maxLatencyMs <= 0) {
            this.#throwSetupError("Invalid configuration: 'maxLatencyMs' must be a positive number.");
        }
        if (!telemetryService || typeof telemetryService.getLatency !== 'function') {
            this.#throwSetupError("Telemetry service dependency is missing or invalid (missing 'getLatency' function).");
        }
        this.#config = Object.freeze(config);
        this.#telemetryService = telemetryService;
    }

    /**
     * Executes the transport latency check policy.
     * @param {string} transportId - The ID of the transport to check.
     * @returns {Promise<boolean>} True if latency is within limits, false otherwise.
     */
    async check(transportId) {
        const latency = await this.#delegateToTelemetryRetrieval(transportId);
        return this.#validateLatency(latency);
    }

    // --- I/O Proxy Functions ---

    /**
     * Isolates interaction with the external telemetry service.
     * Satisfies the I/O Proxy Creation Goal.
     */
    async #delegateToTelemetryRetrieval(transportId) {
        try {
            // Assumes telemetryService.getLatency returns latency in milliseconds
            return await this.#telemetryService.getLatency(transportId);
        } catch (error) {
            this.#logExternalServiceError(transportId, error);
            // In case of telemetry failure, default to assuming policy failure (fail-safe)
            return Infinity; 
        }
    }

    /**
     * Isolates core validation logic and control flow (failure logging).
     * Satisfies the I/O Proxy Creation Goal.
     */
    #validateLatency(currentLatencyMs) {
        const max = this.#config.maxLatencyMs;

        if (currentLatencyMs > max) {
            this.#logLatencyBreach(currentLatencyMs, max);
            return false;
        }
        return true;
    }

    /**
     * Isolates I/O operation (logging) for policy breaches.
     * Satisfies the I/O Proxy Creation Goal.
     */
    #logLatencyBreach(latency, max) {
        // Use console.warn for policy failure notifications
        console.warn(`[TransportLatencyPolicyKernel] Policy violation: Latency breach detected. Max: ${max}ms. Measured: ${latency}ms.`);
    }

    /**
     * Isolates I/O operation (error logging) for external service failures.
     * Satisfies the I/O Proxy Creation Goal.
     */
    #logExternalServiceError(id, error) {
        console.error(`[TransportLatencyPolicyKernel] CRITICAL: Failed to access Telemetry Service for ID ${id}.`, error.message);
    }

    /**
     * Isolates control flow for setup errors.
     * Satisfies the I/O Proxy Creation Goal.
     */
    #throwSetupError(message) {
        throw new Error(`[TransportLatencyPolicyKernel Setup Error] ${message}`);
    }
}