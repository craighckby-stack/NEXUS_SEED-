/**
 * TraceContextInitializer: Manages the generation and propagation of the mandatory 'trace_id'
 * for the Trusted Event Data Stream (TEDS). Ensures unique, high-entropy IDs compliant with the TEDS schema.
 */

import { v4 as uuidv4 } from 'crypto'; // Use cryptographically secure UUID generator

class TraceContextInitializer {

    /**
     * Generates a new, globally unique execution trace ID.
     * @returns {string} A standard UUID v4 string.
     */
    static generateTraceId() {
        return uuidv4();
    }

    /**
     * Initializes or validates the trace context for a new execution cycle.
     * This should be called by the GSEP-C entry point (S00).
     * @param {string | null} incomingId - Optional ID inherited from external source.
     * @returns {string} The verified or newly generated trace ID.
     */
    static getOrInitializeContext(incomingId = null) {
        if (incomingId && typeof incomingId === 'string' && incomingId.length > 30) {
            // Basic validation - full regex check should happen in the logger utility upon TEDS record creation
            return incomingId;
        }
        return TraceContextInitializer.generateTraceId();
    }

}

export default TraceContextInitializer;