import { SchemaValidatorCore, GTCMObjectSchema, IValidationResult, GTCMType, GTCMProperty } from "./plugins/SchemaValidatorCore";

/**
 * Public Validation Result Interface
 */
export type ValidationResult = IValidationResult;

// Re-export core types for consumers of this utility
export { GTCMType, GTCMProperty, GTCMObjectSchema };

/**
 * GTCM_Schema_ValidatorImpl
 * Encapsulated implementation of the GTCM Schema Validator logic, isolating dependency interactions.
 */
class GTCM_Schema_ValidatorImpl {
    
    constructor() {
        this.#setupDependencies();
    }

    /**
     * Ensures all necessary dependencies are statically resolved and prepared.
     * Satisfies the synchronous setup extraction goal.
     */
    #setupDependencies(): void {
        // SchemaValidatorCore is statically imported and ready for use.
    }

    /**
     * Private proxy to delegate the validation execution to the SchemaValidatorCore module.
     * This strictly isolates interaction with the external dependency.
     * Satisfies the I/O proxy creation goal.
     * @param data The data structure to validate.
     * @param schema The GTCM schema definition.
     * @returns A ValidationResult object.
     */
    #delegateToCoreValidationExecution(data: unknown, schema: GTCMObjectSchema): IValidationResult {
        // I/O boundary: Direct interaction with external dependency (SchemaValidatorCore)
        // Start validation at the root path 'root'.
        return SchemaValidatorCore.validateRecursive(data, schema, 'root');
    }

    /**
     * Public instance method used by the external static wrapper.
     * @param data The data structure to validate.
     * @param schema The GTCM schema definition.
     * @returns A ValidationResult object.
     */
    public validate(data: unknown, schema: GTCMObjectSchema): ValidationResult {
        return this.#delegateToCoreValidationExecution(data, schema);
    }
}

// Private singleton instance used to execute the logic
const gtcmValidatorInstance = new GTCM_Schema_ValidatorImpl();

/**
 * GTCM_Schema_Validator
 * Utility class providing the entry point for Governance-based data structure validation.
 * Abstraction is achieved by delegating the complex, recursive validation logic to the
 * reusable SchemaValidatorCore plugin via an encapsulated implementation.
 * 
 * NOTE: The public API remains static for backward compatibility, leveraging a private singleton instance.
 */
export class GTCM_Schema_Validator {
    
    /**
     * Validates a data structure against a defined GTCM schema.
     * This method serves as the public interface, initiating the recursive core validation
     * through the internal, encapsulated implementation.
     * @param data The data structure to validate.
     * @param schema The GTCM schema definition.
     * @returns A ValidationResult object.
     */
    public static validate(data: unknown, schema: GTCMObjectSchema): ValidationResult {
        // Delegate execution to the private singleton instance
        return gtcmValidatorInstance.validate(data, schema);
    }
}