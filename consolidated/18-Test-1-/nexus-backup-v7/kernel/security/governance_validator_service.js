import { CanonicalPayloadGenerator } from '@agi-kernel/plugins/CanonicalPayloadGenerator';
import { MultiSignatureRoleVerifier } from '@agi-kernel/plugins/MultiSignatureRoleVerifier';

/**
 * Interface defining the necessary methods from the KeyStoreService dependency.
 * This service manages cryptographic keys.
 */
type KeyStoreService = {
    getPublicKey: (keyId: string) => any; // Returns public key material
};

/**
 * Type definition for a single signature credential provided in the request.
 */
type SignatureCredential = {
    keyId: string;
    signature: string;
    role: string;
};

/**
 * Type definition for the standardized output of the signature verification process.
 */
type SignatureVerificationResult = {
    verifiedRoles: string[];
    valid: boolean;
    error: string | null;
};

/**
 * Sovereign AGI v94.1 | Governance Validator Service
 * Primary service for handling cryptographic verification of transition requests.
 * Decouples the low-level security mechanism (key lookup) from the high-level governance rules.
 */
class GovernanceValidatorService {

    #keyStore: KeyStoreService;

    /**
     * @param {KeyStoreService} keyStore - Service managing cryptographic keys and identities.
     */
    constructor(keyStore: KeyStoreService) {
        this.#keyStore = keyStore;
    }

    // --- I/O Proxy Methods ---

    /** Proxy for KeyStoreService.getPublicKey. */
    #delegateToKeyStoreGetPublicKey(keyId: string): any {
        return this.#keyStore.getPublicKey(keyId);
    }

    /** Proxy for console logging operations. */
    #logVerificationWarning(message: string): void {
        console.warn(message);
    }

    /** Proxy for CanonicalPayloadGenerator execution. */
    #delegateToCanonicalPayloadGenerator(payload: object): string {
        return CanonicalPayloadGenerator.generate(payload);
    }

    /** Proxy for MultiSignatureRoleVerifier execution. */
    #delegateToMultiSignatureRoleVerifier(
        dataToVerify: string, 
        signatures: SignatureCredential[], 
        verifyCallback: Function
    ): SignatureVerificationResult {
        const result = MultiSignatureRoleVerifier.execute({
            dataToVerify: dataToVerify, 
            signatures: signatures,
            verifyCallback: verifyCallback
        });
        // Type casting is safely encapsulated here
        return result as SignatureVerificationResult;
    }

    /** 
     * Proxy/MOCK for the actual cryptographic verification engine.
     * Isolates the external verification call and potential system logging.
     */
    #delegateToCryptoVerificationEngine(keyId: string, dataToHash: string, signature: string, publicKey: any): boolean {
        // In a live system, this would call keyStore.verify(publicKey, dataToHash, signature);
        this.#logVerificationWarning(`MOCK CRYPTO VERIFICATION: Key ID ${keyId}. (MOCKING SUCCESS)`);
        return true; 
    }
    
    /**
     * Internal worker function handling public key lookup and cryptographic verification.
     * This method is bound and passed to the MultiSignatureRoleVerifier plugin.
     *
     * @param {string} keyId - The ID of the public key.
     * @param {string} dataToHash - The canonical data string.
     * @param {string} signature - The signature to verify.
     * @returns {boolean} True if the signature is valid.
     */
    private #executeVerification(keyId: string, dataToHash: string, signature: string): boolean {
        const publicKey = this.#delegateToKeyStoreGetPublicKey(keyId);
        
        if (!publicKey) {
            this.#logVerificationWarning(`Verification failed: Public key not found for ID ${keyId}.`);
            return false;
        }

        return this.#delegateToCryptoVerificationEngine(keyId, dataToHash, signature, publicKey);
    }


    /**
     * Validates cryptographic signatures provided in the credentials object against the transition payload.
     * Maps valid signatures back to system roles (e.g., 'Sovereign_Trustee', 'Operational_Lead').
     *
     * @param {object} payload - The full command/transition object being authorized.
     * @param {SignatureCredential[]} signatures - Array of signatures, containing (keyId, signature, role).
     * @returns {SignatureVerificationResult}
     */
    verifyTransitionSignatures(
        payload: object,
        signatures: SignatureCredential[]
    ): SignatureVerificationResult {

        // 1. Canonicalize the payload using an existing tool (isolated via proxy)
        const canonicalData = this.#delegateToCanonicalPayloadGenerator(payload);

        // 2. Define the verification binding (binding the internal worker function)
        const boundVerifyCallback = this.#executeVerification.bind(this);

        // 3. Use the extracted plugin for multi-signature processing and role mapping (isolated via proxy)
        return this.#delegateToMultiSignatureRoleVerifier(canonicalData, signatures, boundVerifyCallback);
    }
}

export { GovernanceValidatorService };