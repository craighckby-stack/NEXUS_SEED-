/**
 * @file AttestationFailureRecord.js
 * Represents an immutable record of a failed attestation attempt.
 * This class is a pure data structure requiring its serialization schema 
 * to be injected upon instantiation. Static factory and schema retrieval 
 * methods are delegated to a strategic Factory Kernel to enforce asynchronous 
 * configuration retrieval and dependency resolution.
 *
 * NOTE: It is assumed that 'ImmutableRecordBase' is provided through the 
 * module environment or inheritance chain, eliminating the need for synchronous `require`.
 */

class AttestationFailureRecord extends ImmutableRecordBase {
    /**
     * Constructs an immutable failure record.
     * 
     * NOTE: This constructor now requires the validated serialization schema 
     * to be passed by the calling Factory/Tool Kernel.
     * 
     * @param {object} data - Data structure containing properties.
     * @param {string} data.attestationId - Unique ID of the failed attestation.
     * @param {string} data.validatorId - ID of the validator that recorded the failure.
     * @param {string} data.reason - Concise reason for the failure.
     * @param {number} data.timestamp - Timestamp (ms) of the failure.
     * @param {Object<string, string>} recordSchema - The serialization/minification schema.
     */
    constructor(data, recordSchema) {
        // 1. Enforce essential validation
        if (!data || !data.attestationId || typeof data.attestationId !== 'string' || 
            !data.validatorId || typeof data.timestamp !== 'number' || !data.reason) {
            throw new Error("AttestationFailureRecord: Required fields missing or invalid data type.");
        }

        // 2. Validate injected configuration dependency
        if (!recordSchema || typeof recordSchema !== 'object' || Object.keys(recordSchema).length === 0) {
            throw new Error("AttestationFailureRecord: Required recordSchema configuration dependency missing or invalid.");
        }

        // 3. The base constructor handles property definition, immutability, and assignment,
        // utilizing the injected schema for mapping.
        super(data, recordSchema);
    }

    /**
     * Serializes the record into a minimized JSON structure.
     * Assumes the base class (ImmutableRecordBase) implements this method 
     * using the schema passed during construction.
     * @returns {Object}
     */
    toJSON() {
        // Delegate serialization responsibility entirely to the base class.
        return super.toJSON();
    }
    
    // NOTE: Static methods (fromJSON, getSchema) are removed. They introduce 
    // synchronous dependencies on configuration (schema) and utility kernel references,
    // and must be implemented by an external, asynchronous Factory/Tool Kernel.
}

module.exports = AttestationFailureRecord;