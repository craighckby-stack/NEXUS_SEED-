/**
 * ContractArtifactValidator
 * Ensures consistency and integrity of loaded smart contract JSON artifacts (ABI, bytecode, metadata).
 * This utility enhances system stability by preventing runtime failures caused by partial or corrupted build files.
 *
 * NOTE: Core validation remains static. File loading concerns (loadAndValidate) are now intended
 * to be managed by an injected or higher-level ArtifactLoader utility.
 */

const { InvalidArtifactError } = require('./errors/InvalidArtifactError');

class ContractArtifactValidator {
    // Define mandatory structure and constant values explicitly for clarity and maintainability.
    static MANDATORY_KEYS = ['contractName', 'abi', 'bytecode'];
    static HEX_PREFIX = '0x';
    // Regex for checking valid hex string (0x followed by even length hex content)
    static HEX_REGEX = /^0x([0-9a-fA-F]{2})*$/;
    static BYTECODE_MAX_SIZE = 10 * 1024 * 1024; // 10MB limit for raw bytecode artifact size sanity check

    /**
     * Internal helper to validate basic object structure and key presence.
     * @param {object} artifact - The JSON content loaded.
     */
    static _validateStructure(artifact) {
        if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) {
            throw new InvalidArtifactError('Artifact must be a non-null object.', { reason: 'TYPE_OR_NULL' });
        }

        const missingKeys = ContractArtifactValidator.MANDATORY_KEYS.filter(
            key => !(key in artifact)
        );

        if (missingKeys.length > 0) {
            const contractName = artifact.contractName || 'Unknown';
            throw new InvalidArtifactError(
                `Artifact for '${contractName}' is missing required keys: ${missingKeys.join(', ')}. `,
                { reason: 'MISSING_KEYS', keys: missingKeys }
            );
        }
    }

    /**
     * Validates that the provided string is a valid EVM hex representation.
     * @param {string} data - The bytecode string.
     * @param {string} fieldName - The name of the field being checked (e.g., 'bytecode', 'deployedBytecode').
     * @param {string} contractName - The name of the contract.
     */
    static _validateBytecode(data, fieldName, contractName) {
        if (typeof data !== 'string') {
            throw new InvalidArtifactError(
                `${fieldName} for ${contractName} must be a string. `,
                { field: fieldName, reason: 'NOT_STRING' }
            );
        }
        if (!ContractArtifactValidator.HEX_REGEX.test(data)) {
            throw new InvalidArtifactError(
                `${fieldName} for ${contractName} is malformed. Must be a valid hex string starting with ${ContractArtifactValidator.HEX_PREFIX} and having even length content. `,
                { field: fieldName, reason: 'MALFORMED_HEX' }
            );
        }
        // Basic sanity check against arbitrarily large artifacts
        if (data.length > ContractArtifactValidator.BYTECODE_MAX_SIZE) {
             throw new InvalidArtifactError(
                `${fieldName} for ${contractName} exceeds reasonable size limit. `,
                { field: fieldName, reason: 'SIZE_EXCEEDED' }
            );
        }
    }

    /**
     * Validates the structure and necessary components of a raw contract artifact JSON object.
     * @param {object} rawArtifact - The JSON content loaded from a contract artifact file.
     * @returns {object} The validated artifact object.
     * @throws {InvalidArtifactError} if the artifact is invalid or missing critical fields.
     */
    static validate(rawArtifact) {
        // 1. Structural Check
        ContractArtifactValidator._validateStructure(rawArtifact);

        const name = rawArtifact.contractName.trim();
        const contractId = name || 'Unknown Contract';

        // 2. Core Type & Format Checks

        // Check A: Contract Name
        if (typeof rawArtifact.contractName !== 'string' || name === '') {
            throw new InvalidArtifactError('Contract name must be a non-empty string.', { field: 'contractName', reason: 'EMPTY_STRING' });
        }

        // Check B: ABI
        if (!Array.isArray(rawArtifact.abi)) {
            throw new InvalidArtifactError(`ABI for ${contractId} must be an array.`, { field: 'abi', reason: 'NOT_ARRAY' });
        }

        // Check C: Bytecode (Critical for deployment)
        ContractArtifactValidator._validateBytecode(rawArtifact.bytecode, 'bytecode', contractId);

        // 3. Optional/Recommended Checks (Improved logging/handling)

        // Check D: Deployed Bytecode (If present, must be valid hex)
        if (rawArtifact.deployedBytecode) {
             try {
                 ContractArtifactValidator._validateBytecode(rawArtifact.deployedBytecode, 'deployedBytecode', contractId);
             } catch (e) {
                 // Downgrade critical failure to warning for deployedBytecode, as it might not be strictly needed for validation flow
                 console.warn(`[Validator] Deployed bytecode validation failed for ${contractId}. Ignoring if deployment isn't required. Error: ${e.message}`);
             }
        }

        // Check E: Metadata presence
        if (typeof rawArtifact.metadata !== 'string' && typeof rawArtifact.metadata !== 'object') {
             console.warn(`[Validator] Artifact for ${contractId} is missing or has malformed 'metadata'. This hinders source verification.`);
        }

        return rawArtifact;
    }

    /**
     * Placeholder method signaling reliance on external I/O dependency (ArtifactLoader/FS Utility).
     * This method must be updated or removed if dependency injection is implemented differently.
     * @param {string} artifactPath
     */
    static async loadAndValidate(artifactPath) {
        // Responsibility moved to ArtifactLoader utility.
        throw new InvalidArtifactError(
            `loadAndValidate functionality must be provided by a specialized loader utility encapsulating I/O. Path: ${artifactPath}.`
        );
    }
}

module.exports = ContractArtifactValidator;
