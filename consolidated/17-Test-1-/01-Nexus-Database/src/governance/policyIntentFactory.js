/**
 * Utility: Policy Intent Factory (PIF)
 * ID: PIF-v94.1
 * Mandate: Centralize the creation of standardized, high-security mutation intent packages (M-XX series),
 *          ensuring strict metadata compliance required for RSAM attestation, leveraging an external schema registry.
 */
// Import centralized governance schemas. Proposed location via scaffolding.
const INTENT_SCHEMAS = require('./config/intentSchemas'); 

class PolicyIntentFactory {
    /**
     * @param {Object} uuidGenerator - A compliant UUID generation utility (e.g., v4).
     */
    constructor(uuidGenerator) {
        if (!uuidGenerator || typeof uuidGenerator.v4 !== 'function') {
             throw new Error("PolicyIntentFactory requires a compliant uuidGenerator.");
        }
        this.uuidGenerator = uuidGenerator;
        this.intentSchemas = INTENT_SCHEMAS;
    }

    /**
     * Validates and retrieves the required metadata for a given intent type ID (M-XX).
     * @param {string} typeId - E.g., 'M01', 'M02'.
     * @returns {Object} Intent configuration metadata.
     */
    _getIntentMetadata(typeId) {
        const metadata = this.intentSchemas[typeId];
        if (!metadata) {
            // High security requirement: fail fast on unknown intent types.
            throw new Error(`PIF Integrity Breach: Unknown Intent Type ID provided: ${typeId}`);
        }
        return metadata;
    }

    /**
     * Generically creates a standardized, high-security mutation intent package (M-XX series).
     * This replaces hardcoded specific methods (like createM01Intent) with a scalable approach.
     *
     * @param {string} typeId - The registered intent code (e.g., 'M01').
     * @param {MutationIntentPayload} rawRequest - The core operational payload.
     * @returns {IntentPackage} Structured intent object for governance registration.
     */
    createIntent(typeId, rawRequest) {
        const metadata = this._getIntentMetadata(typeId);
        
        // Standard UUID generation prefixed by Intent Code for traceability
        const intentId = `${typeId}-${this.uuidGenerator.v4()}`;

        // Construct the compliant package based on centralized governance configuration
        return {
            id: intentId,
            type: metadata.type, 
            priority: metadata.priority, 
            timestamp: new Date().toISOString(),
            // Embed the original raw payload safely
            targetPayload: rawRequest,
            // Attach standardized security requirements derived from the schema
            securityMetadata: metadata.security
        };
    }

    // Removed defunct specialized methods (e.g., createM01Intent) in favor of createIntent(M01, ...)
}

module.exports = PolicyIntentFactory;
