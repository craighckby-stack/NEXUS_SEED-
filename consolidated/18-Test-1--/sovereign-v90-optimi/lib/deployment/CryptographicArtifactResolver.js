/**
 * @class CryptographicArtifactResolver
 * Manages secure retrieval of deployment artifacts based on cryptographic identity.
 */
class CryptographicArtifactResolver {
    #client;
    #integrityVerifier;

    /**
     * @param {object} secureStorageClient - Client for retrieving artifacts (must have getArtifact).
     * @param {object} integrityVerifier - Instance of IntegrityVerificationService plugin.
     */
    constructor(secureStorageClient, integrityVerifier) {
        this.#setupDependencies(secureStorageClient, integrityVerifier);
    }

    /**
     * Extracts and validates core dependencies.
     * @param {object} secureStorageClient 
     * @param {object} integrityVerifier 
     */
    #setupDependencies(secureStorageClient, integrityVerifier) {
        if (!integrityVerifier || typeof integrityVerifier.verifyArtifactIntegrity !== 'function') {
            this.#throwSetupError("requires a valid IntegrityVerificationService instance.");
        }
        if (!secureStorageClient || typeof secureStorageClient.getArtifact !== 'function') {
            this.#throwSetupError("requires a valid secureStorageClient with a 'getArtifact' method.");
        }
        
        this.#client = secureStorageClient;
        this.#integrityVerifier = integrityVerifier;
    }

    /**
     * Throws an error during setup validation.
     * @param {string} message 
     */
    #throwSetupError(message) {
        throw new Error(`CryptographicArtifactResolver ${message}`);
    }

    /**
     * Delegates to the secure storage client to retrieve the artifact.
     * @param {string} sha256Hash 
     * @returns {Promise<object>} Artifact object containing content.
     */
    async #delegateToClientRetrieval(sha256Hash) {
        return this.#client.getArtifact(sha256Hash);
    }

    /**
     * Delegates to the integrity verifier service.
     * @param {string} sha256Hash 
     * @param {Buffer} content 
     * @param {string} algorithm 
     */
    #delegateToIntegrityVerification(sha256Hash, content, algorithm) {
        // Expected to throw if validation fails.
        this.#integrityVerifier.verifyArtifactIntegrity(sha256Hash, content, algorithm);
    }

    /**
     * Resolves a hash identifier to its corresponding binary content.
     * @param {string} sha256Hash - The SHA-256 hash provided in the ADM instruction.
     * @returns {Promise<Buffer>} The validated binary content of the artifact.
     */
    async resolve(sha256Hash) {
        
        const artifact = await this.#delegateToClientRetrieval(sha256Hash);

        // Utilize the abstracted service for critical integrity validation
        this.#delegateToIntegrityVerification(sha256Hash, artifact.content, 'sha256');

        return artifact.content;
    }
}

module.exports = CryptographicArtifactResolver;