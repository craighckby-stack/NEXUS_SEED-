/**
 * ArtifactValidatorService - Ensures adherence to defined artifact schemas and cryptographic constraints.
 * Ingests artifact payload and schema definition to perform verification.
 */
class ArtifactValidatorService {

    /**
     * @param {object} schemaRegistry - The configuration object defining artifact schemas.
     * @param {object} cryptoService - Dependency for cryptographic operations (signatures, hashes, merkle).
     * @param {object} constraintUtility - Utility for specialized type/format checks.
     */
    constructor(schemaRegistry, cryptoService, constraintUtility) {
        if (!schemaRegistry || !cryptoService || !constraintUtility) {
            throw new Error("ArtifactValidatorService requires schemaRegistry, cryptoService, and constraintUtility dependencies.");
        }
        this.registry = schemaRegistry;
        this.constraintUtility = constraintUtility;
        
        // Delegate cryptographic concerns to a specialized plugin
        this.cryptoValidator = new CryptographicArtifactValidatorPlugin(cryptoService);
    }

    /**
     * Validates an artifact against its registered schema and cryptographic rules.
     * @param {string} artifactId The ID (e.g., 'PMH_LOCK_V1')
     * @param {object} payload The artifact data
     * @returns {Promise<boolean>} True if validation succeeds.
     * @throws {Error} If validation fails at any stage.
     */
    async validate(artifactId, payload) {
        const definition = this.registry.artifact_definitions[artifactId];
        if (!definition) {
            throw new Error(`Schema definition not found for artifact: ${artifactId}`);
        }

        // 1. Structural and Constraint Validation
        this._validateStructure(definition.schema, payload, artifactId);

        // 2. Cryptographic Integrity Validation
        await this.cryptoValidator.validate(definition.cryptographic_requirements, payload, artifactId);

        return true;
    }

    /**
     * Performs structural validation (presence, type, format checks) using the StructuralSchemaValidator tool.
     * This abstracts the iteration logic away from the service.
     */
    _validateStructure(schema, payload, artifactId) {
        const fieldValidator = (field, value, constraints) => {
            // Delegate strong type/format checking (e.g., HASH_SHA256, TIMESTAMP_ISO8601)
            // This relies on the injected constraintUtility
            this.constraintUtility.validateField(field, value, constraints);
        };

        try {
            // Use the extracted structural validation tool
            // CRITICAL: Assumes StructuralSchemaValidator is globally available via kernel injection.
            StructuralSchemaValidator.execute({
                schema,
                payload,
                fieldValidator
            });
        } catch (e) {
            // Catch errors thrown by the validator and re-throw with Artifact ID context.
            throw new Error(`[${artifactId}] Validation failed: ${e.message}`);
        }
    }
}

module.exports = ArtifactValidatorService;