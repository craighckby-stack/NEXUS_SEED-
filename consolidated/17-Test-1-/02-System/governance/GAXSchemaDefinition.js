/**
 * Defines the structural schema for the GAX Master Protocol configuration.
 * This ensures integrity and compliance with mandated architectural constraints.
 * (Translated from components/protocol/GAXSchemaDefinition.py)
 */

const GAXLimitsSchema = {
    type: 'object',
    properties: {
        severity_thresholds: {
            type: 'object',
            description: "Hard limits for acceptable severity levels in PIM (Protocol Integrity Matrix)."
        }
    },
    required: ['severity_thresholds']
};

const GAXProtocolMandatesSchema = {
    type: 'object',
    properties: {
        required_p_sets: {
            type: 'array',
            items: { type: 'string' },
            description: "Mandatory P-Set types that must be defined in PIM_CONSTRAINTS."
        }
    },
    required: ['required_p_sets']
};

const GAXMasterSchema = {
    type: 'object',
    properties: {
        version: { type: 'string' },
        protocol_mandates: GAXProtocolMandatesSchema,
        limits: GAXLimitsSchema,
        GAX_II: {
            type: 'string',
            description: "The primary architectural mandate definition (formerly field alias 'GAX_II')."
        }
    },
    required: ['version', 'protocol_mandates', 'limits', 'GAX_II']
};

module.exports = {
    GAXMasterSchema,
    GAXProtocolMandatesSchema,
    GAXLimitsSchema
};
