const fs = require('fs/promises');
const path = require('path');
const ContractArtifactValidator = require('./ContractArtifactValidator');
const { InvalidArtifactError } = require('./errors/InvalidArtifactError');

/**
 * ArtifactLoader
 * Handles file system interaction for reading, parsing, and immediately validating contract artifacts.
 * This abstracts away I/O concerns from the core ContractArtifactValidator utility.
 */
class ArtifactLoader {
    
    /**
     * Loads a contract artifact JSON file, parses it, and validates its structure.
     * This implements the functionality previously noted as missing in ContractArtifactValidator.loadAndValidate.
     * @param {string} artifactPath - Absolute or relative path to the artifact JSON file.
     * @returns {Promise<object>} The validated contract artifact object.
     */
    static async load(artifactPath) {
        let rawData;
        try {
            const absolutePath = path.resolve(artifactPath);
            rawData = await fs.readFile(absolutePath, 'utf8');
        } catch (error) {
            throw new InvalidArtifactError(
                `Failed to read contract artifact file at path: ${artifactPath}.`,
                { originalError: error.message, path: artifactPath, reason: 'IO_READ_FAILURE' }
            );
        }

        let artifact;
        try {
            artifact = JSON.parse(rawData);
        } catch (error) {
            throw new InvalidArtifactError(
                `Failed to parse contract artifact JSON: ${artifactPath}.`,
                { originalError: error.message, path: artifactPath, reason: 'JSON_PARSE_FAILURE' }
            );
        }

        // Delegate integrity checking to the specialized Validator utility
        return ContractArtifactValidator.validate(artifact);
    }
}

module.exports = ArtifactLoader;