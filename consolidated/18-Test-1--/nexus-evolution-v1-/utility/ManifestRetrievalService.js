const crypto = require('crypto');
const fs = require('fs/promises');

/**
 * Manifest Retrieval Service (MRS) V1.0
 * MISSION: Securly retrieve and validate the Workload Configuration and Integrity Manifest (WCIM) 
 * against a known sovereign cryptographic public key before passing it to the IVA.
 * This ensures the IVA only verifies code against a trusted, untampered manifest.
 */
class ManifestRetrievalService {
    /**
     * @param {string} publicKeyPath - Path to the PEM file containing the sovereign public key.
     */
    constructor(publicKeyPath) {
        this.publicKeyPath = publicKeyPath;
        this.publicKey = null;
        if (!publicKeyPath) {
             console.error("[MRS] Warning: Initialized without public key path. Signature verification will fail.");
        }
    }

    async initialize() {
        if (!this.publicKeyPath) {
            throw new Error("MRS Initialization Error: Cannot initialize without a sovereign public key path.");
        }
        try {
            this.publicKey = await fs.readFile(this.publicKeyPath, 'utf8');
            console.log("[MRS] Sovereign public key loaded successfully for signature verification.");
        } catch (error) {
            throw new Error(`MRS Init Error: Failed to load public key from ${this.publicKeyPath}. Reason: ${error.message}`);
        }
    }

    /**
     * Fetches raw manifest data, assuming a format containing payload and signature.
     * NOTE: In a production AGI, this would involve a secure network request (e.g., API call).
     * @param {string} sourceIdentifier - Local file path or secure API URL.
     * @returns {Promise<{payload: string, signature: string, version: string}>}
     */
    async fetchManifestRaw(sourceIdentifier) {
        console.log(`[MRS] Attempting retrieval of WCIM from: ${sourceIdentifier}`);
        try {
            const fullManifestData = await fs.readFile(sourceIdentifier, 'utf8');
            const fullManifest = JSON.parse(fullManifestData);
            
            if (!fullManifest.signed_payload || !fullManifest.signature) {
                 throw new Error("Raw manifest lacks required 'signed_payload' or 'signature' fields.");
            }

            return {
                payload: fullManifest.signed_payload, 
                signature: fullManifest.signature,
                version: fullManifest.version || 'unknown'
            };
        } catch (e) {
            throw new Error(`MRS Fetch Error: Could not retrieve or parse raw manifest: ${e.message}`);
        }
    }

    /**
     * Verifies the digital signature of the WCIM payload using the sovereign public key.
     */
    verifyManifestSignature(payload, signature) {
        if (!this.publicKey) {
            throw new Error("MRS Error: Public key not loaded. Cannot verify signature.");
        }

        // Assuming industry standard algorithm for manifest signing (e.g., RSA-SHA256)
        const verifier = crypto.createVerify('RSA-SHA256'); 
        verifier.update(payload);
        
        const isVerified = verifier.verify(this.publicKey, signature, 'base64');

        if (!isVerified) {
            console.error("CRITICAL SECURITY ALERT: WCIM signature verification FAILED. Manifest data is untrusted.");
        }
        return isVerified;
    }

    /**
     * Retrieves, verifies signature, and returns the trusted manifest object.
     */
    async getVerifiedManifest(sourceIdentifier) {
        if (!this.publicKey) await this.initialize();
        
        const rawData = await this.fetchManifestRaw(sourceIdentifier);
        
        // Step 1: Verify Trust
        if (!this.verifyManifestSignature(rawData.payload, rawData.signature)) {
            throw new Error("WCIM Trust Failure: Manifest signature mismatch. Aborting verification.");
        }

        // Step 2: Parse Trusted Data
        try {
            return JSON.parse(rawData.payload);
        } catch (e) {
             throw new Error("WCIM Trust Failure: Failed to parse trusted manifest payload.");
        }
    }
}

module.exports = ManifestRetrievalService;