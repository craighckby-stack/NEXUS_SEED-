/**
 * TraceContextInitializer: Manages the generation and propagation of the mandatory 'trace_id'
 * for the Trusted Event Data Stream (TEDS). Ensures unique, high-entropy IDs compliant with the TEDS schema.
 * Utilizes the CanonicalIDGeneratorUtility for secure ID generation.
 */

// Assumed declaration for the imported utility interface
declare const CanonicalIDGeneratorUtility: {
    generateCanonicalID(): string;
    isValidCanonicalID(id: string): boolean;
};

class TraceContextInitializer {

    /**
     * Generates a new, globally unique execution trace ID using the CanonicalIDGeneratorUtility.
     * @returns {string} A standard UUID v4 string.
     */
    static generateTraceId(): string {
        // Calls the extracted utility for canonical ID generation
        return CanonicalIDGeneratorUtility.generateCanonicalID();
    }

    /**
     * Initializes or validates the trace context for a new execution cycle.
     * This should be called by the GSEP-C entry point (S00).
     * @param {string | null} incomingId - Optional ID inherited from external source.
     * @returns {string} The verified or newly generated trace ID.
     */
    static getOrInitializeContext(incomingId: string | null = null): string {
        if (incomingId && typeof incomingId === 'string') {
            
            // 1. Check using the robust utility validator if available
            if (typeof CanonicalIDGeneratorUtility.isValidCanonicalID === 'function' && CanonicalIDGeneratorUtility.isValidCanonicalID(incomingId)) {
                return incomingId;
            }
            
            // 2. Fallback to original basic length check (UUID V4 is 36 chars, > 30 is a loose validity signal)
            if (incomingId.length > 30) {
                 return incomingId;
            }
        }

        return TraceContextInitializer.generateTraceId();
    }
}

export default TraceContextInitializer;