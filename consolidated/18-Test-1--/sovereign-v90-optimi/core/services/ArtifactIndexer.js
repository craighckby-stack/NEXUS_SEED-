/**
 * core/services/ArtifactIndexer.js
 * 
 * Centralized service responsible for managing artifact lifecycle: content storage,
 * integrity validation, manifest generation, and index registration
 * according to the Sovereign Manifest Protocol.
 */

// Assuming ProtocolError is located in a standard exceptions path
const ProtocolError = require('../exceptions/ProtocolError');

class ArtifactIndexer {
    #contentStorage;
    #manifestStore;
    #hasher;
    #logger;
    #manifestGenerator;

    /**
     * @param {object} dependencies 
     * @param {object} dependencies.contentStorage - Interface for storing raw content (e.g., FS, S3).
     * @param {object} dependencies.manifestStore - Interface for managing manifest records (e.g., Database, KV store).
     * @param {object} dependencies.hasher - Utility for cryptographic integrity calculations (e.g., BLAKE3/SHA-256).
     * @param {object} dependencies.logger - Structured logging service.
     * @param {object} dependencies.manifestGenerator - The SovereignManifestGenerator plugin, responsible for construction and validation.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Extracts dependency assignment and ensures existence.
     */
    #setupDependencies({ contentStorage, manifestStore, hasher, logger, manifestGenerator }) {
        if (!contentStorage || !manifestStore || !hasher || !logger || !manifestGenerator) {
            throw new Error("ArtifactIndexer requires contentStorage, manifestStore, hasher, logger, and manifestGenerator.");
        }
        this.#contentStorage = contentStorage;
        this.#manifestStore = manifestStore;
        this.#hasher = hasher;
        this.#logger = logger; 
        this.#manifestGenerator = manifestGenerator;
    }

    // --- I/O Proxy Functions ---

    /**
     * Calculates size and integrity hash using the delegated hasher.
     * @param {Buffer} content
     * @returns {{ algorithm: string, hash: string, size: number }} 
     */
    #delegateToHasherCalculate(content) {
        const hash = this.#hasher.calculate(content);
        return { 
            algorithm: this.#hasher.getAlgorithmName(), 
            hash,
            size: content.length
        };
    }

    /**
     * Persists content to the dedicated Content Storage.
     * @param {Buffer} content 
     * @param {string} hash 
     * @returns {Promise<string>} The storage location identifier.
     */
    async #delegateToContentStorageStore(content, hash) {
        return this.#contentStorage.store(content, hash);
    }

    /**
     * Constructs and validates the manifest using the specialized generator plugin.
     * @param {object} params
     * @returns {object} The validated manifest.
     */
    #delegateToManifestGenerator(params) {
        return this.#manifestGenerator.generateAndValidateManifest(params);
    }

    /**
     * Records the compliant manifest in the Index.
     * @param {object} manifest
     * @returns {Promise<void>} 
     */
    async #delegateToManifestStoreRecord(manifest) {
        await this.#manifestStore.recordManifest(manifest);
    }

    /**
     * Retrieves a manifest record from the dedicated Index Store.
     */
    async #delegateToManifestStoreGet(id) {
        return this.#manifestStore.getManifest(id);
    }

    /**
     * Stores artifact content, calculates integrity, and generates a canonical manifest.
     * @param {Buffer} content 
     * @param {object} baseMetadata - Contains artifact classification (type, name, operation_id).
     * @returns {Promise<object>} The fully populated and validated manifest.
     */
    async indexArtifact(content, baseMetadata) {
        if (!content || content.length === 0) {
            this.#logger.warn('Attempted to index empty or null artifact content.', { metadata: baseMetadata });
            throw new ProtocolError("Cannot index empty artifact content.");
        }

        // 1. Calculate size and integrity hash (critical step for verifiability).
        const { algorithm, hash, size: artifactSize } = this.#delegateToHasherCalculate(content);
        const integrity = { algorithm, hash };
        
        // 2. Persist content to the dedicated Content Storage.
        const location = await this.#delegateToContentStorageStore(content, integrity.hash);

        // 3. Construct and validate the manifest using the specialized generator plugin.
        const manifest = this.#delegateToManifestGenerator({
            baseMetadata,
            integrity,
            location,
            size: artifactSize,
        });
        
        // 4. Record the compliant manifest in the Index.
        await this.#delegateToManifestStoreRecord(manifest);
        
        this.#logger.info(`Artifact indexed successfully.`, {
            artifactId: manifest.id,
            type: baseMetadata.type,
            size: artifactSize,
            hashPrefix: integrity.hash.slice(0, 12)
        });
        return manifest;
    }

    /**
     * Retrieves a manifest record from the dedicated Index Store.
     */
    async getManifest(id) {
        return this.#delegateToManifestStoreGet(id);
    }
}