/**
 * Governance Config: Payload Schema Registry
 * ID: GS-PSR-v94.1
 * Mandate: Stores concrete validation structures (schemas) for the payload data associated with
 * various Mutation Intent Packages (M-XX). This is used by the Policy Intent Factory and data marshalling services
 * to validate incoming mutation data against predefined structural requirements.
 */

// Simple recursive freeze utility to ensure deep immutability of configuration data
const deepFreeze = (obj) => {
    Object.freeze(obj);
    Object.values(obj).forEach(prop => {
        if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
            deepFreeze(prop);
        }
    });
    return obj;
};


// --- Payload Schema Definitions ---
// These schemas define the expected 'shape' of the data carried within an Intent Package payload.

const rawPayloadSchemas = {
    // P-POL-001: Core Policy Mutation Payload (Linked to M01)
    'P-POL-001': {
        description: 'Defines fields required for altering core governance policies.',
        fields: Object.freeze([
            { name: 'policyId', dataType: 'String', constraint: 'Pattern(/CP-[A-Z0-9]{5}/)', required: true },
            { name: 'patchOperations', dataType: 'Array<PatchOp>', required: true, description: 'RFC 6902 compliant JSON patch array.' },
            { name: 'justificationHash', dataType: 'SHA256', required: true }
        ]),
        maxPayloadSizeKB: 100
    },

    // P-RES-002: Resource Budget Change Payload (Linked to M02)
    'P-RES-002': {
        description: 'Defines structural requirements for updating system resource utilization limits.',
        fields: Object.freeze([
            { name: 'targetComponent', dataType: 'String', required: true },
            { name: 'budgetDelta', dataType: 'Object<ResourceChange>', required: true },
            { name: 'effectiveTimestamp', dataType: 'ISO8601', required: true }
        ]),
        maxPayloadSizeKB: 5
    },

    // P-AUD-003: Audit Log Configuration Payload (Linked to M03)
    'P-AUD-003': {
        description: 'Defines parameters for audit log retention and storage settings.',
        fields: Object.freeze([
            { name: 'retentionDays', dataType: 'Number', required: true, min: 30, max: 3650 },
            { name: 'encryptionEnabled', dataType: 'Boolean', required: true }
        ]),
        maxPayloadSizeKB: 1
    }
};

// Ensure the registry and all nested structures are deeply immutable.
const PayloadSchemaRegistry = deepFreeze(rawPayloadSchemas);

module.exports = PayloadSchemaRegistry;
