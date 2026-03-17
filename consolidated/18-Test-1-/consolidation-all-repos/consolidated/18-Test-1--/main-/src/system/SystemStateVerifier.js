/**
 * SSV: SYSTEM STATE VERIFIER (V95.3) - Intelligence Refactor
 * Scope: Stage 1/Security Core. Provides critical cryptographic integrity services.
 * Function: Manages external communication to the immutable manifest store (MCR)
 * and provides hashing and verification utilities for core system artifacts (code,
 * configuration, governance rules). Ensures all critical state changes are attested.
 * DEPENDENCIES: ImmutableLedgerConnector, CryptoService (must implement SHA256/ECDSA or similar)
 */
class SystemStateVerifier {
    /**
     * @param {Object} immutableLedgerConnector - The service connecting to the immutable ledger/manifest store.
     * @param {Object} cryptoService - The dedicated cryptographic utility service.
     */
    constructor(immutableLedgerConnector, cryptoService) {
        if (!immutableLedgerConnector) {
            throw new Error("[SSV Init] Requires connection to the immutable manifest store (Ledger Connector).");
        }
        if (!cryptoService || typeof cryptoService.hash !== 'function' || typeof cryptoService.verifySignature !== 'function') {
            throw new Error("[SSV Init] Requires a robust CryptoService implementing hash and verifySignature.");
        }

        this.ledger = immutableLedgerConnector;
        this.crypto = cryptoService;
        this.cache = new Map(); // Cache validated manifest data (key: manifestId, value: {data, hash})
    }

    /**
     * Calculates the cryptographic hash (SHA-256) of the structured data string.
     * @param {string} dataString - JSON stringified data payload.
     * @returns {string} The cryptographic hash.
     */
    _calculateDataHash(dataString) {
        // Utilizing the injected CryptoService for genuine hashing
        return this.crypto.hash(dataString, 'sha256');
    }

    /**
     * Fetches a governance manifest (like the GRS rule set) and verifies its integrity and authenticity.
     * @param {string} manifestId - Identifier for the required manifest (e.g., 'GRS_V95.3').
     * @param {string} attestationKeyId - Key ID used to verify the external signature.
     * @returns {Promise<Object>} The verified and parsed manifest data.
     * @throws {Error} If verification fails (hash mismatch, invalid signature, or not found).
     */
    async getVerifiedManifest(manifestId, attestationKeyId) {
        if (this.cache.has(manifestId)) {
            return this.cache.get(manifestId).data;
        }

        // 1. Fetch signed manifest bundle from the ledger connector
        const bundle = await this.ledger.fetchSignedArtifact(manifestId);

        if (!bundle || !bundle.data || !bundle.attestedHash || !bundle.signature) {
             throw new Error(`SSV Integrity Failure: Bundle for ${manifestId} is malformed or missing required fields.`);
        }

        // 2. Perform internal hash validation (Data integrity check)
        // NOTE: The hash validation should precede signature verification for efficiency, as hashing is cheaper.
        const calculatedHash = this._calculateDataHash(bundle.data);

        if (calculatedHash !== bundle.attestedHash) {
            throw new Error(`SSV Integrity Failure [Hash]: Manifest ${manifestId} internal data mismatch. Expected: ${bundle.attestedHash}, Got: ${calculatedHash}`);
        }
        
        // 3. Verify external signature (Authenticity check using cryptographic key store)
        // Standard security practice often involves signing the attestedHash, not the raw data, 
        // but we follow the defined interface using bundle.data as the message.
        const isValidSignature = this.crypto.verifySignature(bundle.data, bundle.signature, attestationKeyId);
        
        if (!isValidSignature) {
            // Log this severe failure attempt or raise a more specific authentication error
            console.error(`SSV AUTHENTICITY ERROR: Signature verification failed for manifest ${manifestId}. Key: ${attestationKeyId}`);
            throw new Error(`SSV Authenticity Failure: Manifest ${manifestId} signature verification failed.`);
        }

        const data = JSON.parse(bundle.data);
        
        // Store the validated data and hash together
        this.cache.set(manifestId, { data, hash: calculatedHash });
        return data;
    }

    /**
     * Retrieves the last attested hash for a specific artifact version from the internal cache or ledger.
     * Crucially, this ensures the artifact has passed full integrity and authenticity checks 
     * before returning its hash. The SSV guarantees that any returned hash is cryptographically verified.
     * @param {string} artifactId 
     * @returns {Promise<string>} The verified hash string.
     * @throws {Error} If verification fails or the manifest cannot be loaded.
     */
    async getArtifactHash(artifactId) {
        if (this.cache.has(artifactId)) {
            return this.cache.get(artifactId).hash;
        }
        
        // Force full verification (fetch, hash check, signature check) via getVerifiedManifest.
        // If getVerifiedManifest fails (due to integrity, authenticity, or not found errors),
        // the error propagates immediately, upholding the SSV's security contract.
        await this.getVerifiedManifest(artifactId); 
        
        // Since getVerifiedManifest populates the cache upon success, we can safely retrieve the hash now.
        return this.cache.get(artifactId).hash;
    }
}

module.exports = SystemStateVerifier;