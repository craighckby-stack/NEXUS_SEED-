/**
 * MADR: Mutation Artifact Definition Repository
 * V97.0.0: High-Fidelity Schema Governance Service
 *
 * Provides versioned, immutable storage and validation endpoints for key GSEP artifacts (M-01 Intent, M-02 Payload).
 * Ensures structural governance compliance required by ASR, CIM, and MPSE *before* computational heavy lifting
 * by leveraging pre-compiled JSON Schemas (via Ajv).
 *
 * Architectural Contracts:
 * 1. Store and retrieve cryptographically hashed schemas.
 * 2. Pre-compile schemas for ultra-fast validation during runtime.
 * 3. Offer highly descriptive validation failure reports using standard Ajv error formatting.
 */
const artifactSchemas = require('./madr/schema_manifest.json');
const SchemaValidator = require('../utils/schemaValidator'); // New Dependency

/**
 * Custom Error Definitions for Governance Layer
 */
class GovernanceError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'GovernanceError';
        this.context = context;
    }
}

class ValidationFailureError extends GovernanceError {
    constructor(message, validationErrors, context = {}) {
        super(message, context);
        this.name = 'ValidationFailureError';
        this.validationErrors = validationErrors;
    }
}


class MutationArtifactDefinitionRepository {
    /**
     * @param {object} schemas - Optional override for the schema definitions map.
     */
    constructor(schemas = artifactSchemas) {
        this.schemas = schemas;
        // V97.0: Validator must be injected or internally initialized.
        this.validator = new SchemaValidator();
        this.compiledValidators = {};

        // V97.0: Compile all required schemas upon initialization for peak runtime efficiency (ASR Stage 1 requirement).
        this._compileAllSchemas();
    }

    _compileAllSchemas() {
        try {
            for (const artifactId in this.schemas) {
                for (const version in this.schemas[artifactId]) {
                    const schema = this.schemas[artifactId][version];
                    const key = `${artifactId}:${version}`;
                    this.compiledValidators[key] = this.validator.compile(schema);
                }
            }
        } catch (e) {
            throw new GovernanceError(`MADR Critical Initialization Error: Schema compilation failed: ${e.message}`, { details: e });
        }
    }

    /**
     * Retrieves the canonical schema definition for a given artifact ID and version.
     * @param {string} artifactId - e.g., 'M-01', 'M-02'
     * @param {string} [version='latest'] - Specific schema version string.
     * @returns {object} The schema definition object.
     * @throws {GovernanceError} If the definition is missing.
     */
    getSchema(artifactId, version = 'latest') {
        const definitions = this.schemas[artifactId];
        if (!definitions) {
            throw new GovernanceError(`MADR Lookup Error (G-001): Artifact ID "${artifactId}" not registered in manifest.`);
        }
        const schema = definitions[version];
        if (!schema) {
             throw new GovernanceError(`MADR Lookup Error (G-002): Schema version "${version}" not found for artifact "${artifactId}".`);
        }
        return schema;
    }

    /**
     * Internal method to retrieve the pre-compiled validator function.
     * @private
     */
    _getValidator(artifactId, version = 'latest') {
        const key = `${artifactId}:${version}`;
        const validatorFn = this.compiledValidators[key];
        if (!validatorFn) {
            // Use getSchema for standardized error reporting if pre-compilation failed or key mismatch occurred.
            this.getSchema(artifactId, version);
            throw new GovernanceError(`MADR Internal Error (G-003): Validator function not compiled for ${key}. Internal state mismatch.`);
        }
        return validatorFn;
    }


    /**
     * Validates an artifact payload against its mandatory schema (defaults to 'latest').
     * @param {string} artifactId - e.g., 'M-01', 'M-02'
     * @param {object} payload - The artifact data to validate.
     * @param {string} [version='latest'] - Specific schema version string.
     * @returns {boolean} True if validation passes.
     * @throws {ValidationFailureError} If validation fails.
     */
    validate(artifactId, payload, version = 'latest') {
        const validateFn = this._getValidator(artifactId, version);

        if (!validateFn(payload)) {
            // Validator function stores detailed errors on its property (standard Ajv behavior)
            const errors = validateFn.errors || [];
            const context = {
                artifactId: artifactId,
                version: version,
                // Truncate payload for secure logging/debugging context
                payloadSample: JSON.stringify(payload).substring(0, 150) + '...'
            };

            throw new ValidationFailureError(
                `Governance Validation Failed for ${artifactId} v${version}. Payload violates canonical schema definition.`,
                errors,
                context
            );
        }

        return true;
    }
}

// Export the initialized singleton instance and the class definition.
module.exports = new MutationArtifactDefinitionRepository();
module.exports.MutationArtifactDefinitionRepository = MutationArtifactDefinitionRepository;
