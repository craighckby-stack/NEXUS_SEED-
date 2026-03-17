const MUTATION_INTENT_SCHEMA_ID = 'MutationIntentPayloadSchema';

/**
 * Kernel: Intent Schema Validator Kernel
 * ID: ISVK-v1.0.0
 * Focus: High-integrity, asynchronous validation of mutation intent payloads against canonical schemas.
 */
class IntentSchemaValidatorKernel {

    /**
     * @param {object} dependencies
     * @param {ConfigSchemaRegistryKernel} dependencies.configSchemaRegistry
     * @param {ISpecValidatorKernel} dependencies.specValidator
     * @param {IRegistryInitializerToolKernel} dependencies.registryInitializer
     */
    constructor({ configSchemaRegistry, specValidator, registryInitializer }) {
        this.configSchemaRegistry = configSchemaRegistry;
        this.specValidator = specValidator;
        this.registryInitializer = registryInitializer;
        this.schemaId = MUTATION_INTENT_SCHEMA_ID;
    }

    /**
     * Registers the required Mutation Intent Schema definition with the Config Registry.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Define the JSON schema based on the structure required by the original utility.
        const schemaDefinition = {
            $id: this.schemaId,
            type: 'object',
            description: 'Canonical schema for a mutation intent payload.',
            properties: {
                intentId: { type: 'string', description: 'Traceable ID of the intent', optional: true },
                source: { type: 'string', description: 'Originating system/module' },
                targets: {
                    type: 'array',
                    items: { type: 'object' }, // Placeholder for TargetDescriptor, requiring array structure
                    description: 'List of affected resources/targets'
                },
                timestamp: { type: 'number', description: 'Unix timestamp of creation' }
            },
            required: ['source', 'targets', 'timestamp'],
            additionalProperties: false
        };

        await this.registryInitializer.registerSchema({
            registry: this.configSchemaRegistry,
            schema: schemaDefinition
        });
    }

    /**
     * Validates a raw mutation intent payload against the registered canonical schema.
     * 
     * @param {Object} rawPayload - The raw input data.
     * @returns {Promise<Object>} Validated payload (or throws an error).
     * @throws {Error} If the payload violates required structural constraints.
     */
    async validateMutationIntent(rawPayload) {
        if (!rawPayload || typeof rawPayload !== 'object') {
            throw new Error("ISVK Validation Failure: Payload must be a valid object.");
        }

        const result = await this.specValidator.validate({
            schemaId: this.schemaId,
            payload: rawPayload
        });

        if (!result.isValid) {
            // Use aggregated errors provided by ISpecValidatorKernel
            const errors = (result.errors || []).map(e => e.message || e.instancePath).join('; ');
            throw new Error(`ISVK Validation Failure: Structural constraints violated for ${this.schemaId}. Errors: ${errors}`);
        }

        return rawPayload;
    }
}

module.exports = IntentSchemaValidatorKernel;