// This file replaces the Python implementation for Node.js compatibility (UNIFIER Protocol).

/**
 * A concrete implementation of the SystemTelemetryProxy interface (conceptually) used for 
 * testing, initial bootstrapping, or simulations. Provides fixed, representative placeholder values.
 */

const RESOURCE_FORECAST_DATA = Object.freeze({
    cpu_load_baseline: 0.45,
    memory_headroom: 2.5,
    i_o_latency_p95: 15.0 
});

const CONSTRAINT_STATUS_DATA = Object.freeze({
    MAX_CONCURRENCY: 1024,
    ACTIVE_VERSION_ID: "v94.0-stable",
    SECURITY_MODE: "Hardened"
});

class MockSystemTelemetryProxy {

    /**
     * Retrieves mock resource forecast data.
     * @returns {Object<string, number>}
     */
    get_resource_forecast() {
        // Return a copy to ensure immutability if consumer tries to modify.
        return {...RESOURCE_FORECAST_DATA};
    }
    
    /**
     * Retrieves mock operational constraints status.
     * @returns {Object<string, any>}
     */
    get_constraint_status() {
        return {...CONSTRAINT_STATUS_DATA};
    }
}

// UNIFIER Protocol Requirement: Export the module.
module.exports = MockSystemTelemetryProxy;