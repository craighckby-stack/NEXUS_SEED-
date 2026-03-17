const fs = require('fs/promises');

// Assuming StructuralSchemaValidatorTool and CryptographicSignatureValidator are available via the runtime context
// declare const StructuralSchemaValidatorTool: any;
// declare const CryptographicSignatureValidator: any;

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
     * NOTE: Uses StructuralSchemaValidatorTool for input integrity checking.
     * @param {string} sourceIdentifier - Local file path or secure API URL.
     * @returns {Promise<{payload: string, signature: string, version: string}>}
     */
    async fetchManifestRaw(sourceIdentifier) {
        console.log(`[MRS] Attempting retrieval of WCIM from: ${sourceIdentifier}`);
        
        const requiredSchema = {
            type: 'object',
            properties: {
                signed_payload: { type: 'string' },
                signature: { type: 'string' }
            },
            required: ['signed_payload', 'signature']
        };

        try {
            const fullManifestData = await fs.readFile(sourceIdentifier, 'utf8');
            const fullManifest = JSON.parse(fullManifestData);
            
            // Use existing StructuralSchemaValidatorTool
            const validationResult = StructuralSchemaValidatorTool.execute(fullManifest, requiredSchema);

            if (!validationResult.valid) {
                 const error = `Raw manifest failed structural validation: ${validationResult.errors ? JSON.stringify(validationResult.errors) : 'Missing required fields.'}`;
                 throw new Error(error);
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
     * Utilizes the new CryptographicSignatureValidator plugin.
     */
    verifyManifestSignature(payload, signature) {
        if (!this.publicKey) {
            throw new Error("MRS Error: Public key not loaded. Cannot verify signature.");
        }

        // Default algorithm based on previous requirements
        const algorithm = 'RSA-SHA256'; 

        const isVerified = CryptographicSignatureValidator.verify({
            publicKey: this.publicKey,
            payload: payload,
            signature: signature,
            algorithm: algorithm
        });

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