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
     * @param {string} artifactPath - Absolute or relative path to the artifact JSON file.
     * @returns {Promise<object>} The validated contract artifact object.
     */
    static async load(artifactPath) {
        
        // Use the FsJsonLoaderUtility for safe I/O and parsing
        const result = await this.FsJsonLoaderUtility.execute({ filePath: artifactPath });
        
        if (!result.success) {
            const errorDetails = result.error;

            // Map structured plugin error back to application-specific error
            throw new InvalidArtifactError(
                errorDetails.message,
                { 
                    originalError: errorDetails.details,
                    path: artifactPath, 
                    reason: errorDetails.code 
                }
            );
        }

        const artifact = result.data;

        // Delegate integrity checking to the specialized Validator utility
        return ContractArtifactValidator.validate(artifact);
    }
}

module.exports = ArtifactLoader;
