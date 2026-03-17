// utilities/ASDM_ArtifactValidator.js
// Utility responsible for loading and enforcing ASDM artifact structures defined in config/ASDM_ArtifactSchemas.json.

import schemas from '../config/ASDM_ArtifactSchemas.json';

// Assume the AGI Kernel context provides access to the defined utility via a global KERNEL object or similar mechanism.
// For demonstration, we simulate the execution call using a conceptual ToolExecutor type declaration.
declare const KERNEL: {
    execute(toolName: 'RequiredFieldEnforcerUtility', args: { artifactType: string, artifactData: object, requiredFields: string[] }): { isValid: boolean, errors: string[] };
};

const SCHEMA_REGISTRY = schemas.Registry;

/**
 * Validator utilizing the RequiredFieldEnforcerUtility for enforcing basic ASDM structural integrity.
 */
export class ASDM_ArtifactValidator {
    /**
     * Validates an artifact against its registered schema using strict enforcement.
     * @param {string} artifactType - Key matching the Registry (e.g., 'TaskDefinition').
     * @param {object} artifactData - The artifact object to validate.
     * @returns {boolean} True if valid.
     * @throws {Error} If the artifact is invalid or the type is unknown.
     */
    static enforce(artifactType, artifactData) {
        const definition = SCHEMA_REGISTRY[artifactType];
        
        if (!definition) {
            throw new Error(`ASDM Validation Error: Unknown artifact type requested: ${artifactType}`);
        }
        
        // --- Phase 1: Basic Structure Check (required_fields) using Kernel Utility
        
        // The responsibility of checking for missing fields is delegated to the Kernel utility.
        const validationResult = KERNEL.execute('RequiredFieldEnforcerUtility', {
            artifactType: artifactType,
            artifactData: artifactData,
            requiredFields: definition.required_fields || []
        });

        if (!validationResult.isValid) {
            // Throw the first encountered error, mimicking the original implementation's quick fail behavior.
            throw new Error(validationResult.errors[0]);
        }

        // --- Phase 2: Detailed Schema Check (Conceptual integration with JSON Schema Validator)
        // TODO: Integrate with a full JSON Schema Validator tool (e.g., SchemaValidationEngineTool or similar AJV integration) here.

        console.log(`Artifact validation successful for type: ${artifactType}`);
        return true;
    }
}

// Example export for immediate use/testing
// export default ASDM_ArtifactValidator;