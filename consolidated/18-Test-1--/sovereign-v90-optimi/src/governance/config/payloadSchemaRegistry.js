/**
 * Governance Config: Payload Schema Registry Kernel
 * ID: GS-PSR-v94.1
 * Mandate: Stores concrete validation structures (schemas) for the payload data associated with
 * various Mutation Intent Packages (M-XX). This is used by the Policy Intent Factory and data marshalling services
 * to validate incoming mutation data against predefined structural requirements.
 */

class PayloadSchemaRegistryKernel {
    /**
     * @param {object} dependencies
     * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel - For auditable logging.
     */
    constructor(dependencies) {
        this.logger = null;
        this.schemas = {};
        this.#setupDependencies(dependencies);
    }

    #setupDependencies(dependencies) {
        if (!dependencies || !dependencies.ILoggerToolKernel) {
            throw new Error("[PayloadSchemaRegistryKernel] Missing required dependency: ILoggerToolKernel.");
        }
        this.logger = dependencies.ILoggerToolKernel;
        // Note: Other high-integrity dependencies for schema validation/initialization (e.g., ISpecValidatorKernel, IRegistryInitializerToolKernel) 
        // would be added here in subsequent refinement stages.
        this.logger.debug("Dependencies established for PayloadSchemaRegistryKernel.");
    }

    // Simple recursive freeze utility (encapsulated for strict immutability guarantee upon load)
    #deepFreeze(obj) {
        Object.freeze(obj);
        Object.values(obj).forEach(prop => {
            if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
                this.#deepFreeze(prop);
            }
        });
        return obj;
    }

    async initialize() {
        this.logger.info("Initializing PayloadSchemaRegistryKernel (GS-PSR-v94.1). Loading schemas.");

        // --- Payload Schema Definitions (Defined internally or loaded asynchronously from configuration) ---
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

        // Ensure the registry and all nested structures are deeply immutable, guaranteeing high-integrity state.
        this.schemas = this.#deepFreeze(rawPayloadSchemas);

        this.logger.info(`Successfully loaded and froze ${Object.keys(this.schemas).length} governance payload schemas.`);
        return { success: true };
    }

    /**
     * Retrieves a specific payload schema by its ID.
     * @param {string} schemaId - The unique schema identifier (e.g., 'P-POL-001').
     * @returns {Object|undefined} The frozen schema definition.
     */
    getSchema(schemaId) {
        return this.schemas[schemaId];
    }

    /**
     * Retrieves the entire immutable schema registry map.
     * @returns {Object} The complete map of schemas.
     */
    getAllSchemas() {
        return this.schemas;
    }
}

module.exports = PayloadSchemaRegistryKernel;