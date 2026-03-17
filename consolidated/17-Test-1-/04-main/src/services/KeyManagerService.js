import { SignatureUtil } from '../utility/signatureUtil.js';

/**
 * KeyManagerService: Highly efficient, zero-instantiation (static) manager for 
 * cryptographic identity. Optimized for direct memory access to key material, 
 * minimizing function call overhead in high-frequency cryptographic operations.
 * 
 * Directive Compliance: Maximum Computational Efficiency (static access, inline checks),
 * Recursive Abstraction (delegation of crypto primitives to SignatureUtil).
 */
export class KeyManagerService {
    
    // Key material is stored statically, acting as a high-speed cache.
    // Renamed fields for explicit clarity on format and primary role.
    static primaryPrivateKeyPem = null;
    static primaryPublicKeyPem = null;

    /**
     * Initializes the KeyManager, loading the primary signing key materials.
     * This function is the primary key configuration point.
     * @throws {Error} If private key is missing.
     */
    static initialize(privateKeyPem, publicKeyPem) {
        // Fail fast and hard during initialization if the critical resource is missing.
        if (!privateKeyPem) {
            throw new Error("KeyManagerService initialization requires a primary private key.");
        }

        KeyManagerService.primaryPrivateKeyPem = privateKeyPem;
        KeyManagerService.primaryPublicKeyPem = publicKeyPem;
        
        // Computational Optimization Note: For maximum efficiency, if SignatureUtil 
        // supports pre-parsed crypto objects (e.g., CryptoKey), the PEM parsing 
        // should happen here once, and the resulting object cached in static memory.
    }

    /**
     * Provides the primary public key for external verification processes.
     * @returns {string} The public key in PEM format.
     * @throws {Error} If not configured.
     */
    static getPrimaryPublicKey() {
         if (!KeyManagerService.primaryPublicKeyPem) {
            throw new Error("Primary public key not initialized in KeyManagerService.");
        }
        return KeyManagerService.primaryPublicKeyPem;
    }


    /**
     * Signs data using the AGI's primary identity key.
     * MAXIMUM EFFICIENCY: Eliminates the redundant call to getPrimaryPrivateKey() 
     * by directly accessing and checking static state, reducing stack depth.
     * @param {any} data - Data payload to sign.
     * @returns {string} Base64 signature.
     */
    static signWithPrimaryIdentity(data) {
        const key = KeyManagerService.primaryPrivateKeyPem;
        
        if (!key) {
            // Direct check path for minimal stack depth on critical failure.
            throw new Error("Primary signing key not loaded.");
        }
        // Direct delegation to the optimized SignatureUtil.
        return SignatureUtil.sign(data, key);
    }

    /**
     * Verifies a signature against the AGI's primary public key.
     * MAXIMUM EFFICIENCY: Direct static state access for minimal overhead.
     * @param {any} data - Original data.
     * @param {string} signature - Base64 signature.
     * @returns {boolean}
     */
    static verifyWithPrimaryIdentity(data, signature) {
        const pubKey = KeyManagerService.primaryPublicKeyPem;
        
        if (!pubKey) {
            // Direct check path.
            throw new Error("Primary public key not available for verification.");
        }
        // Direct delegation.
        return SignatureUtil.verify(data, signature, pubKey);
    }

    /**
     * Generates a new key pair asynchronously, abstracting generation complexity.
     */
    static generateNewKey() {
        return SignatureUtil.generateKeyPair();
    }
}