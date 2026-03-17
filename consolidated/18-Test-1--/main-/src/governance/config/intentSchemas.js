/**
 * Governance Config: Intent Type Schema Registry
 * ID: GS-ITS-v95.0
 * Mandate: Centralized source of truth for all compliant Mutation Intent Package (M-XX) definitions.
 * Defines intent metadata and links to required payload structures.
 * Ensures strict compliance checks across the Policy Intent Factory and RSAM validator components.
 * Enhancement (v95.0): Introduced explicit INTENT_TYPES constants and improved metadata processing using Object.fromEntries for efficiency.
 */

// --- Configuration Constants ---

/**
 * Defined universe of allowed Intent types. Used for static type checking.
 */
const INTENT_TYPES = Object.freeze({
    POLICY_MODIFICATION: 'POLICY_MODIFICATION',
    RESOURCE_ALLOCATION: 'RESOURCE_ALLOCATION',
    AUDIT_LOG_CONFIG: 'AUDIT_LOG_CONFIG',
    MONITORING_ADJUSTMENT: 'MONITORING_ADJUSTMENT' // New in v95.0
});

const SECURITY_LEVELS = Object.freeze({
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW'
});

// --- Utility & Validation ---

/**
 * Validates, normalizes, and recursively freezes an intent metadata definition.
 * Injects the M-XX identifier as 'id'.
 * @param {string} key - M-XX identifier (e.g., 'M01')
 * @param {object} definition - Intent configuration data
 * @returns {object} Frozen, validated intent definition
 */
const defineIntentMetadata = (key, definition) => {
    // 1. Mandatory field check: payloadSchemaId is now mandatory for validation linkage.
    if (!definition.type || typeof definition.priority !== 'number' || !definition.security || !definition.payloadSchemaId) {
        throw new Error(`Intent Schema Definition Error for ${key}: Missing core required fields (type, priority, security, payloadSchemaId).`);
    }

    // 2. Type validation against constant list
    if (!Object.values(INTENT_TYPES).includes(definition.type)) {
         throw new Error(`Intent Schema Definition Error for ${key}: Invalid intent type specified: ${definition.type}.`);
    }

    // 3. Security level validation
    if (!SECURITY_LEVELS[definition.security.riskAssessmentLevel]) {
        throw new Error(`Intent Schema Definition Error for ${key}: Invalid riskAssessmentLevel.`);
    }

    // 4. Immutability enforcement
    const security = Object.freeze(definition.security);

    return Object.freeze({
        id: key,
        ...definition,
        // Ensure the frozen sub-object is used in the final structure
        security: security
    });
};


// --- Raw Schema Definitions Source ---

const IntentDefinitionSource = {
    // M-01: Core Policy Modification (Highest Priority)
    M01: {
        type: INTENT_TYPES.POLICY_MODIFICATION,
        description: 'Mandatory package for core regulatory policy schema alteration.',
        priority: 99,
        payloadSchemaId: 'P-POL-001', // Links to the concrete payload structure
        security: {
            attestationRequired: true,
            p01CalculationRequired: true,
            riskAssessmentLevel: SECURITY_LEVELS.CRITICAL,
            ttlMinutes: 5
        }
    },

    // M-02: Resource Allocation Change (High Priority)
    M02: {
        type: INTENT_TYPES.RESOURCE_ALLOCATION,
        description: 'Modification of system resource utilization schemas or budgets.',
        priority: 75,
        payloadSchemaId: 'P-RES-002', 
        security: {
            attestationRequired: true,
            p01CalculationRequired: false,
            riskAssessmentLevel: SECURITY_LEVELS.HIGH,
            ttlMinutes: 10
        }
    },

    // M-03: System Configuration Audit Log Change (Medium Priority)
    M03: {
        type: INTENT_TYPES.AUDIT_LOG_CONFIG,
        description: 'Intent to alter parameters governing system audit log retention or visibility.',
        priority: 50,
        payloadSchemaId: 'P-AUD-003', 
        security: {
            attestationRequired: false,
            p01CalculationRequired: true,
            riskAssessmentLevel: SECURITY_LEVELS.MEDIUM,
            ttlMinutes: 60
        }
    },

    // M-04: System Monitoring Adjustment (Medium Priority - V95.0 Addition)
    M04: {
        type: INTENT_TYPES.MONITORING_ADJUSTMENT,
        description: 'Modification of core system telemetry sampling rates or reporting policy.',
        priority: 60,
        payloadSchemaId: 'P-TEL-004',
        security: {
            attestationRequired: false,
            p01CalculationRequired: true,
            riskAssessmentLevel: SECURITY_LEVELS.MEDIUM,
            ttlMinutes: 120
        }
    }
};

// --- Initialization and Export ---

// Process raw definitions, apply strict immutability checks, and use Object.fromEntries for cleaner mapping.
const IntentSchemas = Object.freeze(
    Object.fromEntries(
        Object.entries(IntentDefinitionSource).map(([key, definition]) => 
            [key, defineIntentMetadata(key, definition)]
        )
    )
);

IntentSchemas.INTENT_TYPES = INTENT_TYPES; // Export constants for external use/lookup

module.exports = IntentSchemas;
