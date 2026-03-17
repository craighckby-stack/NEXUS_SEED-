import { ISpecValidatorKernel } from '../../interfaces/tools/ISpecValidatorKernel';
import { ILoggerToolKernel } from '../../interfaces/tools/ILoggerToolKernel';
import { IConstraintDefinitionConfigRegistryKernel } from './interfaces/IConstraintDefinitionConfigRegistryKernel'; 

/**
 * ConstraintValidatorKernel enforces structural and content integrity of governance configurations
 * against predefined canonical constraint schemas using Dependency Injection (DI).
 */
export class ConstraintValidatorKernel {
    private validator: ISpecValidatorKernel;
    private definitionRegistry: IConstraintDefinitionConfigRegistryKernel;
    private logger: ILoggerToolKernel;
    private canonicalConstraintId: string;

    constructor(
        dependencies: {
            validator: ISpecValidatorKernel;
            definitionRegistry: IConstraintDefinitionConfigRegistryKernel;
            logger: ILoggerToolKernel;
        }
    ) {
        // Mandate: Isolate synchronous dependency assignment and validation
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates dependency assignment and synchronous validation, satisfying the synchronous setup extraction mandate.
     */
    #setupDependencies(dependencies: { 
        validator: ISpecValidatorKernel; 
        definitionRegistry: IConstraintDefinitionConfigRegistryKernel; 
        logger: ILoggerToolKernel;
    }): void {
        if (!dependencies.validator) {
            throw new Error('ConstraintValidatorKernel requires ISpecValidatorKernel dependency.');
        }
        if (!dependencies.definitionRegistry) {
            throw new Error('ConstraintValidatorKernel requires IConstraintDefinitionConfigRegistryKernel dependency.');
        }
        if (!dependencies.logger) {
            throw new Error('ConstraintValidatorKernel requires ILoggerToolKernel dependency.');
        }
        
        this.validator = dependencies.validator;
        this.definitionRegistry = dependencies.definitionRegistry;
        this.logger = dependencies.logger;
        
        try {
            // Synchronous configuration setup, relies on registry providing ID synchronously
            this.canonicalConstraintId = this.definitionRegistry.getCanonicalConstraintId();
        } catch (e) {
            this.logger.error("Failed to retrieve canonical constraint ID during setup.", e);
            throw e;
        }
    }

    public async initialize(): Promise<void> {
        this.logger.info(`ConstraintValidatorKernel initialized. Targeting constraint ID: ${this.canonicalConstraintId}`);
    }

    /**
     * Validates the provided configuration data against the defined canonical constraint schema.
     * Validation relies on the injected ISpecValidatorKernel and IConstraintDefinitionConfigRegistryKernel.
     * @param data The data structure to validate.
     * @returns A promise resolving to the validation result.
     */
    public async validate(data: any): Promise<{ isValid: boolean, errors: any[] }> {
        this.logger.debug(`Starting validation for canonical constraint: ${this.canonicalConstraintId}`);
        
        try {
            // Retrieve the constraint schema definition asynchronously
            const schema = await this.definitionRegistry.getConstraintDefinitionSchema(this.canonicalConstraintId);

            // Perform validation using the injected tool
            const result = await this.validator.validate(schema, data);
            
            if (!result.isValid) {
                this.logger.warn(`Canonical constraint validation failed for ID ${this.canonicalConstraintId}.`, { errors: result.errors });
            } else {
                this.logger.debug(`Canonical constraint validation passed for ID ${this.canonicalConstraintId}.`);
            }

            return result;
        } catch (error) {
            this.logger.error(`Critical error during constraint validation for ${this.canonicalConstraintId}.`, error);
            return { isValid: false, errors: [{ message: 'Internal validation failure', detail: error.message }] };
        }
    }
}