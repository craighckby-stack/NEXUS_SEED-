const { ConfigSchemaRegistryKernel, ISpecValidatorKernel, MutationPayloadSpecKernel } = require('AGI_KERNELS');

/**
 * Kernel: Intent Schema Validator
 * ID: GU-ISV-v94.2K
 * Mandate: Provides asynchronous API for validating incoming Mutation Intent Packages (M-XX) against
 * the audited schema registries and extracting necessary security configurations, strictly adhering
 * to AIA Enforcement Layer mandates for non-blocking execution and Maximum Recursive Abstraction.
 */
class IntentSchemaValidatorKernel {

    /**
     * @param {object} dependencies
     * @param {ConfigSchemaRegistryKernel} dependencies.configSchemaRegistry
     * @param {ISpecValidatorKernel} dependencies.specValidator
     * @param {MutationPayloadSpecKernel} dependencies.payloadSpecKernel
     */
    constructor({ configSchemaRegistry, specValidator, payloadSpecKernel }) {
        this.configSchemaRegistry = configSchemaRegistry;
        this.specValidator = specValidator;
        this.payloadSpecKernel = payloadSpecKernel;
        this.INTENT_SCHEMAS_ID = 'GOVERNANCE_INTENT_SCHEMAS'; // Conceptual ID for the collection of intent schemas
    }

    /**
     * Initializes the Kernel and ensures all dependencies are ready.
     * @async
     */
    async initialize() {
        // Mandatory asynchronous initialization check
        if (!this.configSchemaRegistry || !this.specValidator || !this.payloadSpecKernel) {
            throw new Error("IntentSchemaValidatorKernel dependencies not fully injected.");
        }
        await this.configSchemaRegistry.initialize();
        await this.specValidator.initialize();
        await this.payloadSpecKernel.initialize();
    }

    /**
     * Retrieves the complete schema definition for a given intent ID from the audited registry.
     * @async
     * @param {string} intentId - e.g., 'M01', 'M02'
     * @returns {Promise<object|null>} The schema definition or null if not found.
     */
    async getSchema(intentId) {
        if (typeof intentId !== 'string' || intentId.length === 0) {
            return null;
        }
        // Delegation: Retrieve the comprehensive definition for the specific intent via the ConfigSchemaRegistry.
        return await this.configSchemaRegistry.getSchema(intentId);
    }

    /**
     * Performs comprehensive structural and content header validation on a raw incoming intent package.
     * Validation is delegated entirely to the specialized ISpecValidatorKernel.
     * @async
     * @param {object} pkg - The raw intent package to validate.
     * @returns {Promise<{isValid: boolean, errors?: Array<{code: string, message: string, detail: any}>, schema: object|null}>} Detailed validation result.
     */
    async validateIntentPackage(pkg) {
        const intentId = pkg?.intentId;
        if (!intentId) {
            return {
                isValid: false,
                errors: [{ code: 'ISV_001_M', message: 'Missing required intentId for schema lookup.' }],
                schema: null
            };
        }

        const intentSchemaDefinition = await this.getSchema(intentId);

        if (!intentSchemaDefinition) {
             return {
                isValid: false,
                errors: [{ code: 'ISV_002_M', message: `Audited schema definition not found for intentId: ${intentId}.` }],
                schema: null
            };
        }

        // Delegation: Use ISpecValidatorKernel for strict compliance checks (structural integrity, schema adherence)
        const validationResult = await this.specValidator.validate({ 
            schema: intentSchemaDefinition,
            data: pkg
        });

        // Normalize result structure to match expected output
        return {
            isValid: validationResult.isValid,
            errors: validationResult.errors || [],
            schema: intentSchemaDefinition
        };
    }

    /**
     * Extracts required security parameters for execution flow logic from the audited schema.
     * @async
     * @param {string} intentId 
     * @returns {Promise<object|null>} Security configuration object
     */
    async getSecurityConfig(intentId) {
        const schema = await this.getSchema(intentId);
        return (schema && schema.security) ? schema.security : null;
    }

    /**
     * Extracts the required payload schema definition (if one exists), delegating to the specialized payload kernel.
     * @async
     * @param {string} intentId 
     * @returns {Promise<object|null>} JSON Schema definition for the payload.
     */
    async getPayloadSchema(intentId) {
        // Delegation: The MutationPayloadSpecKernel is explicitly designed for retrieving specific payload schemas for validation.
        return await this.payloadSpecKernel.getPayloadSchema(intentId);
    }
}

module.exports = IntentSchemaValidatorKernel;