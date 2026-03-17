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
        this.cryptoService = cryptoService;
        this.constraintUtility = constraintUtility;
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
        await this._validateCryptography(definition.cryptographic_requirements, payload, artifactId);

        return true;
    }

    /**
     * Performs structural validation (presence, type, format checks) by delegating to the utility.
     */
    _validateStructure(schema, payload, artifactId) {
        for (const [field, constraints] of Object.entries(schema)) {
            const hasField = Object.prototype.hasOwnProperty.call(payload, field);

            if (constraints.required && !hasField) {
                throw new Error(`[${artifactId}] Validation failed: Missing required field "${field}"`);
            }

            if (hasField) {
                // Delegate strong type/format checking (e.g., HASH_SHA256, TIMESTAMP_ISO8601)
                const value = payload[field];
                this.constraintUtility.validateField(field, value, constraints);
            }
        }
    }

    /**
     * Performs cryptographic validation (signatures, Merkle proofs) using the CryptoService.
     */
    async _validateCryptography(requirements, payload, artifactId) {
        if (!requirements) {
            return; // No cryptographic requirements specified
        }

        // Canonical data is the specific data block that was signed/hashed.
        const dataToVerify = this._getCanonicalData(payload, requirements.signed_fields);

        // --- 1. Signature Authority Verification ---
        if (requirements.signing_authorities) {
            for (const requirement of requirements.signing_authorities) {
                const { key_identifier_field, signature_field, authority_name } = requirement;

                const keyId = payload[key_identifier_field];
                const signature = payload[signature_field];

                if (!keyId || !signature) {
                    throw new Error(`[${artifactId}] Cryptography failed: Missing key ID (${key_identifier_field}) or signature (${signature_field}) for authority ${authority_name}.`);
                }

                const isValid = await this.cryptoService.verifySignature(dataToVerify, signature, keyId, authority_name);

                if (!isValid) {
                    throw new Error(`[${artifactId}] Cryptography failed: Invalid signature detected for authority: ${authority_name}.`);
                }
            }
        }

        // --- 2. Integrity Check (e.g., Merkle Root Verification) ---
        if (requirements.integrity && requirements.integrity.algorithm.startsWith('MERKLE_')) {
            const { algorithm, target_fields, root_field } = requirements.integrity;
            const claimedRoot = payload[root_field];

            if (!claimedRoot) {
                 throw new Error(`[${artifactId}] Integrity failed: Missing claimed Merkle Root (${root_field}).`);
            }

            // Collect data points whose hashes form the Merkle tree leaves.
            const leavesData = target_fields.map(field => payload[field]);

            const calculatedRoot = await this.cryptoService.calculateMerkleRoot(leavesData, algorithm);

            if (calculatedRoot !== claimedRoot) {
                 throw new Error(`[${artifactId}] Integrity failed: Calculated Merkle Root mismatch (Claimed: ${claimedRoot}, Calculated: ${calculatedRoot}).`);
            }
        }
    }

    /**
     * Helper to prepare the canonicalized data payload used for cryptographic operations.
     * Assumes specific fields need to be canonicalized based on requirements.signed_fields.
     * Note: Proper implementation requires strict JCS (JSON Canonicalization Scheme).
     */
    _getCanonicalData(payload, signedFields) {
        if (signedFields && Array.isArray(signedFields)) {
            const dataSubset = {};
            signedFields.forEach(field => {
                if (Object.prototype.hasOwnProperty.call(payload, field)) {
                    dataSubset[field] = payload[field];
                }
            });
            // A robust JCS implementation would sort keys recursively here.
            return JSON.stringify(dataSubset);
        }
        return JSON.stringify(payload);
    }
}

module.exports = ArtifactValidatorService;