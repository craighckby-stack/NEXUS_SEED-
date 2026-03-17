import { path } from 'path'; // Removed dependency in favor of identifier export

// --- Configuration Constants ---

/**
 * Default location identifier for the primary governance schema file.
 * NOTE: Actual path resolution (e.g., using path.resolve) should occur in the loader utility, 
 * allowing this file to focus solely on definitions and abstract identification.
 */
export const GOVERNANCE_SCHEMA_IDENTIFIER = 'config/governanceSchema.json';

/**
 * Base configuration parameters for the AJV validator instance.
 * Enables strict structural enforcement essential for compliance verification.
 */
export const AJV_CONFIG_STRICT = {
    // Report all structural discrepancies rather than failing fast on the first error.
    allErrors: true,
    // Enforce stricter JSON schema rules (e.g., prohibiting unknown format usages).
    strict: true,
    // Allows AJV to cast data types to match schema types (e.g., "5" -> 5)
    coerceTypes: true,
    // Enable validation for standard formats (e.g., email, uuid, date-time)
    formats: true,
};

// --- Reusable Schema Fragments (Definitions) ---

/**
 * Standard reusable definitions ($defs) for common compliance properties,
 * promoting consistency across larger governance schemas.
 */
export const COMMON_SCHEMA_DEFS = {
    SeverityLevel: {
        type: "string",
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL", "DEBUG"], 
        description: "Standardized operational severity level indicating impact or urgency."
    },
    VetoTriggerSource: {
        type: "string",
        enum: ["POLICY_BREACH", "RESOURCE_EXHAUSTION", "SECURITY_EVENT", "MANUAL_OVERRIDE", "ANOMALY_DETECTION", "INIT_FAILURE"], 
        description: "The originating cause for a veto action, leading to system halt."
    },
    EntityIdentifier: {
        type: "string",
        format: "uuid", // Assumes standard UUID structure for traceability
        description: "A unique identifier for a monitored entity or resource."
    }
};

// --- Fallback Schema Definition ---

/**
 * Defines a minimal, operational schema ensuring system continuity
 * if the primary configuration file is missing or inaccessible during initialization.
 * Utilizes common definitions for internal standardization.
 */
export const MINIMAL_FALLBACK_SCHEMA = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://v94.1/schemas/minimal-compliance.json",
    $defs: COMMON_SCHEMA_DEFS,
    type: "object",
    description: "Minimal necessary compliance structure required for core operational continuity.",
    properties: {
        system_uuid: { $ref: "#/$defs/EntityIdentifier" },
        compliance_level_mandate: {
            $ref: "#/$defs/SeverityLevel",
            description: "The mandated baseline operational severity required (e.g., HIGH)."
        },
        veto_triggers: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    source: { $ref: "#/$defs/VetoTriggerSource" },
                    description: { type: "string", minLength: 10, pattern: "^[A-Z].*" } // Enforcing structure
                },
                required: ["source", "description"], 
                additionalProperties: false
            },
            minItems: 0, 
            description: "List of system events or states that trigger an automatic veto or halt, indexed by source type."
        }
    },
    required: ["compliance_level_mandate", "veto_triggers"],
    additionalProperties: false
};