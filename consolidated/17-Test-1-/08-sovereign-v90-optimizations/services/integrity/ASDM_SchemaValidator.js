import ASDM_Schemas from '../../config/ASDM_ArtifactSchemas.json';

// Define the type expected for a custom format checker function (input is typically 'unknown' from the validator engine)
type FormatChecker = (data: unknown) => boolean;

// Interface definition for the expected validation dependency (SpecValidatorKernel)
interface ISpecValidatorKernel {
    validateArtifact(schemaKey: string, data: object): { isValid: boolean, errors: Array<object> | null };
}

/**
 * ASDM_SchemaValidatorKernel V2.1
 * Autonomous utility module for validating artifacts against the ASDM schemas.
 * Ensures cryptographic commitments comply with current versioned formats.
 * Refactored to use constructor dependency injection and kernel architectural standards.
 */
class ASDM_SchemaValidatorKernel {
    // Rigorously privatized state
    #validator: ISpecValidatorKernel;
    // Retained configuration artifacts for context, even if configuration happens upstream.
    #ASDM_Schemas: typeof ASDM_Schemas = ASDM_Schemas;
    #ASDM_CustomFormats: Record<string, FormatChecker>;

    /**
     * @param {object} dependencies - Must include a fully configured 'validator' instance (ISpecValidatorKernel).
     */
    constructor(dependencies: { validator: ISpecValidatorKernel }) {
        // Define custom formats locally for architectural documentation/context.
        this.#ASDM_CustomFormats = {
            'hash_256+': (data) => typeof data === 'string' && data.length >= 64 && /^[0-9a-fA-F]+$/.test(data),
            'epoch_milliseconds': (data) => typeof data === 'number' && Number.isInteger(data) && data > 1609459200000,
            'ASDM_ID': (data) => typeof data === 'string' && data.length > 10,
        };
        this.#setupDependencies(dependencies);
    }

    /**
     * Synchronously validates and assigns dependencies, ensuring the SpecValidatorKernel is ready.
     */
    #setupDependencies(dependencies: { validator: ISpecValidatorKernel }): void {
        if (!dependencies.validator || typeof dependencies.validator.validateArtifact !== 'function') {
            throw new Error("ASDM_SchemaValidatorKernel initialization failed: Required 'validator' dependency (ISpecValidatorKernel) is missing or incomplete.");
        }
        this.#validator = dependencies.validator;
    }

    /**
     * I/O Proxy: Delegates artifact validation to the configured SpecValidatorKernel.
     * All initialization, compilation, execution, and standard error mapping is delegated to the service plugin.
     * @param {string} schemaKey 
     * @param {object} data 
     */
    #delegateToValidatorValidate(schemaKey: string, data: object): { isValid: boolean, errors: Array<object> | null } {
        return this.#validator.validateArtifact(schemaKey, data);
    }
    
    /**
     * Validates a given data object against a specified ASDM schema key.
     * @param {string} schemaKey - The key corresponding to the desired schema.
     * @param {object} data - The artifact object to validate.
     * @returns {{isValid: boolean, errors: Array<object>|null}}
     */
    validateArtifact(schemaKey: string, data: object): { isValid: boolean, errors: Array<object> | null } {
        return this.#delegateToValidatorValidate(schemaKey, data);
    }
}

export { ASDM_SchemaValidatorKernel };
