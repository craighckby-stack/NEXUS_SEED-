import path from 'path';

// --- Configuration Constants ---

/**
 * Path to the primary governance schema file, used by the configuration loader.
 */
export const DEFAULT_GOVERNANCE_SCHEMA_PATH = path.resolve('config/governanceSchema.json');

/**
 * Base configuration parameters for the AJV validator instance.
 * Enables strict structural enforcement essential for compliance verification.
 */
export const AJV_BASE_CONFIG = {
    // Report all structural discrepancies rather than failing fast on the first error.
    allErrors: true,
    // Enforce stricter JSON schema rules (e.g., prohibiting unknown format usages).
    strict: true,
    // Ensure types defined in schema are respected, even when input is derived from strings (e.g., env vars).
    coerceTypes: true,
};

// --- Reusable Schema Fragments (Definitions) ---

/**
 * Standard reusable definitions ($defs) for common compliance properties,
 * promoting consistency across larger governance schemas.
 */
export const COMMON_SCHEMA_DEFS = {
    SeverityLevel: {
        type: "string",
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"],
        description: "Standardized operational severity level."
    },
    VetoTriggerSource: {
        type: "string",
        enum: ["POLICY_BREACH", "RESOURCE_EXHAUSTION", "SECURITY_EVENT", "MANUAL_OVERRIDE", "ANOMALY_DETECTION"],
        description: "The originating cause for a veto action."
    }
};

// --- Fallback Schema Definition ---

/**
 * Defines a minimal, operational schema ensuring system continuity
 * if the primary configuration file is missing or inaccessible during initialization.
 * Utilizes common definitions for internal standardization.
 */
export const MINIMAL_FALLBACK_SCHEMA = {
    $id: "https://v94.1/schemas/minimal-compliance.json",
    $defs: COMMON_SCHEMA_DEFS,
    type: "object",
    properties: {
        compliance_level_mandate: {
            // Uses standardized $defs reference for consistency and clarity
            $ref: "#/$defs/SeverityLevel",
            description: "The mandated baseline operational severity required (e.g., HIGH)."
        },
        veto_triggers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    source: { $ref: "#/$defs/VetoTriggerSource" },
                    description: { type: "string", minLength: 5 }
                },
                required: ["source"],
                additionalProperties: false
            },
            minItems: 1,
            description: "List of system events or states that trigger an automatic veto or halt, indexed by source type."
        }
    },
    required: ["compliance_level_mandate", "veto_triggers"],
    additionalProperties: false
};