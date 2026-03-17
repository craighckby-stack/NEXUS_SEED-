/**
 * Utility: Intent Schema Validator
 * ID: ISV-v94.3
 * Focus: Ensures that incoming mutation intent payloads adhere strictly to required internal schemas
 *        before being processed by high-risk orchestrators like GCO.
 */
class IntentSchemaValidator {

    /**
     * Defines the required schema structure for a standard MutationIntentPayload.
     * @returns {Object} Schema definition (Simplified for internal utility representation).
     */
    static getRequiredSchema() {
        return {
            intentId: 'string|optional',
            source: 'string|required',
            targets: 'array<TargetDescriptor>|required',
            timestamp: 'number|required'
        };
    }

    /**
     * Validates and returns a standardized mutation intent payload.
     * 
     * @param {Object} rawPayload - The raw input data.
     * @returns {Object} Validated and normalized payload.
     * @throws {Error} If the payload violates required structural constraints.
     */
    validateMutationIntent(rawPayload) {
        if (!rawPayload || typeof rawPayload !== 'object') {
            throw new Error("ISV Validation Failure: Payload must be a valid object.");
        }

        // Example Check 1: Mandatory Fields
        if (!rawPayload.source || typeof rawPayload.source !== 'string') {
            throw new Error("ISV Validation Failure: 'source' field is missing or invalid.");
        }

        // Example Check 2: Targets must be an array
        if (!Array.isArray(rawPayload.targets)) {
            console.warn("ISV Warning: 'targets' field corrected to empty array.");
            rawPayload.targets = [];
        }
        
        // Example Check 3: Targets Structure (Ensure componentID is present for GCO)
        for (const target of rawPayload.targets) {
            if (!target || typeof target !== 'object' || !target.componentID) {
                throw new Error(`ISV Validation Failure: Target descriptor is missing critical 'componentID'. Invalid target: ${JSON.stringify(target)}`);
            }
        }

        // Future improvement: Add deep type checking based on getRequiredSchema()

        return rawPayload;
    }
}

module.exports = IntentSchemaValidator;