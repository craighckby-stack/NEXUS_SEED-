/**
 * ArtifactNotFoundError
 * Custom error class specifically for failures when an expected contract artifact
 * file or data entry cannot be found in the configured locations.
 */
class ArtifactNotFoundError extends Error {
    static CODE = 'E_ARTIFACT_NOT_FOUND';

    /**
     * @param {string} path - The path/identifier that could not be found.
     * @param {string} [message] - Optional custom message.
     */
    constructor(path, message = `Artifact not found at path: ${path}`) {
        super(message);
        
        this.name = ArtifactNotFoundError.name;
        this.code = ArtifactNotFoundError.CODE;
        this.path = path; // Specific path that failed to load
    }
}

module.exports = { ArtifactNotFoundError };
