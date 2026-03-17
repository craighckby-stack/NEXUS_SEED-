import { SignatureUtil } from '../utils/signatureUtil.js';
// Assuming a core environment/configuration file exists:
// import { ENV } from '../config/environment.js';

/**
 * Manages the cryptographic keys, specifically focusing on the AGI's primary signing identity.
 * Handles secure key loading (e.g., from environment or vault) and key usage delegation.
 */
export class KeyManagerService {
    
    static primaryPrivateKey = null;
    static primaryPublicKey = null;

    /**
     * Initializes the KeyManager, loading the primary signing key.
     * Should be called once during system bootstrap.
     */
    static initialize(privateKeyPem, publicKeyPem) {
        // In a real application, this would fetch keys securely from ENV, Vault, or secure mount.
        // For scaffolding, we pass them explicitly or assume they come from a config lookup.
        if (!privateKeyPem) {
            console.warn("KeyManagerService initialization missing private key. Signing operations will fail.");
        }

        KeyManagerService.primaryPrivateKey = privateKeyPem;
        KeyManagerService.primaryPublicKey = publicKeyPem;
    }

    /**
     * Retrieves the AGI's primary signing key.
     * @returns {string} The private key in PEM format.
     * @throws {Error} If the private key is not configured/loaded.
     */
    static getPrimaryPrivateKey() {
        if (!KeyManagerService.primaryPrivateKey) {
            throw new Error("Primary private key not initialized or configured in KeyManagerService.");
        }
        return KeyManagerService.primaryPrivateKey;
    }

    /**
     * Signs data using the AGI's primary identity key.
     * Convenience wrapper around SignatureUtil.sign()
     * @param {any} data - Data payload to sign.
     * @returns {string} Base64 signature.
     */
    static signWithPrimaryIdentity(data) {
        const key = KeyManagerService.getPrimaryPrivateKey();
        return SignatureUtil.sign(data, key);
    }

    /**
     * Verifies a signature against the AGI's primary public key.
     * @param {any} data - Original data.
     * @param {string} signature - Base64 signature.
     * @returns {boolean}
     */
    static verifyWithPrimaryIdentity(data, signature) {
        if (!KeyManagerService.primaryPublicKey) {
            throw new Error("Primary public key not available for verification.");
        }
        return SignatureUtil.verify(data, signature, KeyManagerService.primaryPublicKey);
    }

    /**
     * Delegates key pair generation to SignatureUtil.
     */
    static async generateNewKey() {
        return SignatureUtil.generateKeyPair();
    }
}