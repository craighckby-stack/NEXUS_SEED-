import crypto from 'crypto';
import util from 'util';
import { toCanonicalBuffer } from './canonicalizerUtil.js';
import {
    SIGNATURE_ALGORITHM,
    SIGNATURE_CURVE,
    KEY_ENCODING,
    DEFAULT_SIGNATURE_ENCODING,
    HASH_ALGORITHM,
    DEFAULT_HASH_ENCODING
} from '../config/cryptoConfig.js';

// Promisify Key Generation - Kept local to its usage domain.
const generateKeyPairAsync = util.promisify(crypto.generateKeyPair);

/**
 * Utility focusing on Asymmetric Cryptography (Digital Signatures - ECDSA).
 * Crucial for proving origin, non-repudiation, and verifying state integrity.
 * Relies on canonicalizerUtil for deterministic serialization.
 */
export class SignatureUtil {

    // --- Key Management ---

    /**
     * Generates a new ECDSA public/private key pair suitable for digital signing.
     * @returns {Promise<{publicKey: string, privateKey: string}>}
     */
    static async generateKeyPair() {
        const { publicKey, privateKey } = await generateKeyPairAsync('ec', {
            namedCurve: SIGNATURE_CURVE,
            publicKeyEncoding: KEY_ENCODING.PUBLIC,
            privateKeyEncoding: KEY_ENCODING.PRIVATE
        });
        return { publicKey, privateKey };
    }

    // --- Signing and Verification ---

    /**
     * Generates a digital signature for a data payload using a private key.
     * Data is first deterministically canonicalized before signing.
     * @param {any} data - The data payload to sign.
     * @param {string} privateKeyPem - The private key in PEM format.
     * @returns {string} The digital signature in the configured encoding.
     */
    static sign(data, privateKeyPem) {
        const bufferToSign = toCanonicalBuffer(data);
        const signer = crypto.createSign(SIGNATURE_ALGORITHM);
        signer.update(bufferToSign);
        return signer.sign(privateKeyPem, DEFAULT_SIGNATURE_ENCODING);
    }

    /**
     * Verifies a digital signature against the original data using a public key.
     * Data is first deterministically canonicalized before verification.
     * @param {any} data - The original data payload.
     * @param {string} signature - The digital signature in the configured encoding.
     * @param {string} publicKeyPem - The public key in PEM format.
     * @returns {boolean} True if the signature is valid, false otherwise.
     */
    static verify(data, signature, publicKeyPem) {
        const bufferToVerify = toCanonicalBuffer(data);
        const verifier = crypto.createVerify(SIGNATURE_ALGORITHM);
        verifier.update(bufferToVerify);
        return verifier.verify(publicKeyPem, signature, DEFAULT_SIGNATURE_ENCODING);
    }

    // --- Data Integrity Helper ---
    
    /**
     * Calculates the deterministic hash of the provided data payload.
     * @param {any} data 
     * @returns {string} The configured hash encoding (e.g., hex).
     */
    static hash(data) {
        const buffer = toCanonicalBuffer(data);
        return crypto.createHash(HASH_ALGORITHM).update(buffer).digest(DEFAULT_HASH_ENCODING);
    }
}