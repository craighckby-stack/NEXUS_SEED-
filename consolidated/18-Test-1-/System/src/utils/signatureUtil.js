import crypto from 'crypto';
import util from 'util';
import {
    SIGNATURE_ALGORITHM,
    SIGNATURE_CURVE,
    KEY_ENCODING,
    DEFAULT_SIGNATURE_ENCODING,
    HASH_ALGORITHM,
    DEFAULT_HASH_ENCODING
} from '../config/cryptoConfig.js';

// Promisify Key Generation
const generateKeyPairAsync = util.promisify(crypto.generateKeyPair);

/**
 * Recursively sorts object keys alphabetically to ensure deterministic serialization.
 * @param {any} data
 * @returns {any} A structure identical to data, but with sorted object keys.
 */
function _sortKeysDeep(data) {
    if (typeof data !== 'object' || data === null) {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => _sortKeysDeep(item));
    }

    const sortedKeys = Object.keys(data).sort();
    
    return sortedKeys.reduce((sortedObject, key) => {
        sortedObject[key] = _sortKeysDeep(data[key]);
        return sortedObject;
    }, {});
}

/**
 * Ensures consistent, canonical binary serialization of data for signing/hashing.
 * @param {any} data
 * @returns {Buffer} The serialized buffer (UTF-8 encoded string or raw Buffer).
 */
function _canonicalize(data) {
    if (data instanceof Buffer) {
        return data;
    }
    if (typeof data === 'string') {
        return Buffer.from(data, 'utf8');
    }

    // Step 1: Recursively sort complex objects for determinism.
    if (typeof data === 'object' && data !== null) {
        const sortedData = _sortKeysDeep(data);
        // Step 2: Stringify.
        const str = JSON.stringify(sortedData);
        return Buffer.from(str, 'utf8');
    }

    // Handle primitives
    return Buffer.from(String(data), 'utf8');
}


/**
 * Utility focusing on Asymmetric Cryptography (Digital Signatures - ECDSA).
 * Crucial for proving origin, non-repudiation, and verifying state integrity.
 * Uses deterministic data canonicalization defined internally.
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
     * @param {any} data - The data payload to sign.
     * @param {string} privateKeyPem - The private key in PEM format.
     * @returns {string} The digital signature in the configured encoding.
     */
    static sign(data, privateKeyPem) {
        const bufferToSign = _canonicalize(data);
        const signer = crypto.createSign(SIGNATURE_ALGORITHM);
        signer.update(bufferToSign);
        return signer.sign(privateKeyPem, DEFAULT_SIGNATURE_ENCODING);
    }

    /**
     * Verifies a digital signature against the original data using a public key.
     * @param {any} data - The original data payload.
     * @param {string} signature - The digital signature in the configured encoding.
     * @param {string} publicKeyPem - The public key in PEM format.
     * @returns {boolean} True if the signature is valid, false otherwise.
     */
    static verify(data, signature, publicKeyPem) {
        const bufferToVerify = _canonicalize(data);
        const verifier = crypto.createVerify(SIGNATURE_ALGORITHM);
        verifier.update(bufferToVerify);
        return verifier.verify(publicKeyPem, signature, DEFAULT_SIGNATURE_ENCODING);
    }

    // --- Data Integrity Helpers ---
    
    /**
     * Calculates the hash of deterministically serialized data.
     * @param {any} data 
     * @returns {string} The configured hash encoding (e.g., hex).
     */
    static hash(data) {
        const buffer = _canonicalize(data);
        return crypto.createHash(HASH_ALGORITHM).update(buffer).digest(DEFAULT_HASH_ENCODING);
    }
}