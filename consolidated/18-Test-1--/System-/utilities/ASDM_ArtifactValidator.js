// utilities/ASDM_ArtifactValidator.js
// Utility responsible for loading and enforcing ASDM artifact structures defined in config/ASDM_ArtifactSchemas.json.

import schemas from '../config/ASDM_ArtifactSchemas.json';
// NOTE: In a production AGI environment, a robust schema validation library (like 'ajv' for JSON Schema Draft 7/2020) must be utilized.
// This implementation provides the necessary interface.

const SCHEMA_REGISTRY = schemas.Registry;

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

        // --- Phase 1: Basic Structure Check (required_fields)
        const missingFields = definition.required_fields.filter(field => !(field in artifactData));
        if (missingFields.length > 0) {
            throw new Error(`ASDM Validation Error: [${artifactType}] Missing required fields: ${missingFields.join(', ')}`);
        }

        // --- Phase 2: Detailed Schema Check (Conceptual integration with JSON Schema Validator)
        // TODO: Replace conceptual call with integration to the actual schema validation library (e.g., const validator = new Ajv(); if (!validator.validate(definition.schema_definition, artifactData)) { ... })

        // For now, we rely on Phase 1, but the architecture demands a full JSON Schema check.

        console.log(`Artifact validation successful for type: ${artifactType}`);
        return true;
    }
}

// Example export for immediate use/testing
// export default ASDM_ArtifactValidator;
