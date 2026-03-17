/**
 * @file services/schema_enforcement/GsepCArtifactValidatorKernel.js
 * @description Refactored artifact validator utilizing Dependency Injection and architectural isolation principles.
 */

// Assuming the dependency is now the SchemaRecursiveValidatorKernel, injected externally.
// import { SchemaRecursiveValidatorKernel } from '../plugins/SchemaRecursiveValidatorKernel';

/**
 * Interface for the required validation dependency.
 * @typedef {object} ISchemaRecursiveValidatorKernel
 * @property {(artifact: object, schema: object) => Array<object>} validate - Method to perform validation.
 */

class GsepCArtifactValidatorKernel {
    /**
     * @type {ISchemaRecursiveValidatorKernel}
     */
    #validator;

    /**
     * Constructs the GsepCArtifactValidatorKernel, injecting its primary validation dependency.
     * @param {ISchemaRecursiveValidatorKernel} validatorKernel - The pre-configured recursive schema validator instance.
     */
    constructor(validatorKernel) {
        this.#setupDependencies(validatorKernel);
    }

    /**
     * Rigorously validates and assigns necessary dependencies.
     * @param {ISchemaRecursiveValidatorKernel} validatorKernel
     * @private
     */
    #setupDependencies(validatorKernel) {
        if (!validatorKernel || typeof validatorKernel.validate !== 'function') {
            throw new Error('GsepCArtifactValidatorKernel requires a valid ISchemaRecursiveValidatorKernel with a `validate` method.');
        }
        this.#validator = validatorKernel;
    }

    /**
     * Isolates and delegates the core validation logic to the injected validator dependency.
     * This serves as the mandatory I/O proxy for external tool interaction.
     * @param {object} artifact
     * @param {object} schema
     * @returns {Array<object>} Validation errors.
     * @private
     */
    #delegateToValidatorValidate(artifact, schema) {
        return this.#validator.validate(artifact, schema);
    }

    /**
     * Validates an artifact against a defined schema.
     * @param {object} artifact The data object to validate.
     * @param {object} schema The validation schema (e.g., JSON Schema).
     * @returns {Array<object>} An array of validation errors. Empty array if valid.
     */
    validate(artifact, schema) {
        if (!artifact || !schema) {
            // Local pre-check validation failure
            return [{ message: "Artifact or schema is missing.", path: "$" }];
        }
        return this.#delegateToValidatorValidate(artifact, schema);
    }

    /**
     * Shortcut to check if the artifact is valid (no errors).
     * @param {object} artifact
     * @param {object} schema
     * @returns {boolean}
     */
    isValid(artifact, schema) {
        return this.validate(artifact, schema).length === 0;
    }
}

export { GsepCArtifactValidatorKernel };