/**
 * Utility: Policy Intent Factory (PIF)
 * ID: PIF-v94.2
 * Mandate: Centralize the creation of standardized, high-security mutation intent packages (M-XX series),
 *          ensuring strict metadata compliance required for RSAM attestation, leveraging an external schema registry.
 * Optimization Directive: Max computational efficiency, minimized function call overhead.
 */

// Import centralized governance schemas.
const INTENT_SCHEMAS = require('./config/intentSchemas'); 

class PolicyIntentFactory {
    // Use private fields (#) for maximized property access speed within the instance context.
    #uuidGenerator;
    #schemas;

    /**
     * @param {Object} uuidGenerator - A compliant UUID generation utility (e.g., v4).
     */
    constructor(uuidGenerator) {
        // Optimized validation using optional chaining and type check for speed
        if (typeof uuidGenerator?.v4 !== 'function') {
             throw new Error("PolicyIntentFactory requires a compliant uuidGenerator with a v4 method.");
        }
        
        this.#uuidGenerator = uuidGenerator;
        // Immediate assignment to private field for O(1) retrieval
        this.#schemas = INTENT_SCHEMAS; 
    }

    /**
     * Core recursive abstraction: Generically creates a standardized, high-security mutation intent package (M-XX series).
     * This method is optimized for minimal intermediate variable creation and reduced function call depth.
     *
     * @param {string} typeId - The registered intent code (e.g., 'M01').
     * @param {MutationIntentPayload} rawRequest - The core operational payload.
     * @returns {IntentPackage} Structured intent object for governance registration.
     */
    createIntent(typeId, rawRequest) {
        // Optimization: Inlining metadata retrieval to eliminate intermediate function call overhead (_getIntentMetadata)
        const metadata = this.#schemas[typeId];

        if (!metadata) {
            // Fail fast on integrity breach
            throw new Error(`PIF Integrity Breach: Unknown Intent Type ID provided: ${typeId}`);
        }
        
        // Max efficiency string construction and direct UUID call
        const intentId = `${typeId}-${this.#uuidGenerator.v4()}`;

        // Return single, atomic object literal creation operation.
        // Note: new Date().toISOString() remains the compliance-mandated performance bottleneck.
        return {
            id: intentId,
            type: metadata.type, 
            priority: metadata.priority, 
            // Required high-security timestamp format
            timestamp: new Date().toISOString(),
            targetPayload: rawRequest,
            // Direct deep embedding of security requirements
            securityMetadata: metadata.security
        };
    }
}

module.exports = PolicyIntentFactory;