export default class ComplianceSchemaRegistryKernel {
    // Configuration constant (now encapsulated, accessed via public accessor)
    static SCHEMA_ID_GOVERNANCE_PRIMARY = 'config/governanceSchema.json';

    #commonSchemaDefs = null;
    #minimalFallbackSchema = null;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * @private
     * Rigorously extracts all synchronous dependency assignment and configuration loading.
     */
    #setupDependencies() {
        // --- Reusable Schema Fragments (Definitions) Initialization ---
        this.#commonSchemaDefs = {
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
                format: "uuid",
                description: "A unique identifier for a monitored entity or resource."
            },
            VetoTrigger: {
                type: "object",
                description: "Defines a single condition (source and description) that results in a system veto.",
                properties: {
                    source: { $ref: "#/$defs/VetoTriggerSource" },
                    description: { 
                        type: "string", 
                        minLength: 10, 
                        pattern: "^[A-Z].*",
                        description: "Detailed, standardized description of the specific veto condition. Must start with a capital letter."
                    }
                },
                required: ["source", "description"],
                additionalProperties: false
            }
        };

        // --- Fallback Schema Initialization ---
        this.#minimalFallbackSchema = {
            $schema: "http://json-schema.org/draft-07/schema#",
            $id: "https://v94.1/schemas/minimal-compliance.json",
            $defs: this.#commonSchemaDefs,
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
                    items: { $ref: "#/$defs/VetoTrigger" },
                    minItems: 0, 
                    description: "List of system events or states that trigger an automatic veto or halt, indexed by source type."
                }
            },
            required: ["compliance_level_mandate", "veto_triggers"],
            additionalProperties: false
        };
    }

    /**
     * Retrieves the canonical identifier for the primary governance configuration schema.
     * @returns {string}
     */
    getPrimaryGovernanceSchemaIdentifier() {
        return ComplianceSchemaRegistryKernel.SCHEMA_ID_GOVERNANCE_PRIMARY;
    }

    /**
     * Retrieves the minimal operational fallback schema for compliance validation.
     * @returns {object}
     */
    getMinimalFallbackSchema() {
        return this.#minimalFallbackSchema;
    }

    /**
     * Retrieves the standard reusable schema fragments ($defs).
     * @returns {object}
     */
    getCommonSchemaDefinitions() {
        return this.#commonSchemaDefs;
    }
}