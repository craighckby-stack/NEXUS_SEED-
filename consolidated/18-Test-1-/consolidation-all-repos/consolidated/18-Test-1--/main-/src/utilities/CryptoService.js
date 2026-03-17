const crypto = require('crypto');
const Policy = require('../config/SecurityPolicy');
const util = require('util');

/**
 * A promisified version of the Node.js crypto.scrypt function.
 * Note: This is used internally by the PolicyScryptKDFExecutor.
 */
const scryptAsync = util.promisify(crypto.scrypt);

// Placeholder/wrapper for the PolicyScryptKDFUtility plugin execution.
// In a true AGI-Kernel environment, this would be provided by the runtime's Tool Execution Context.
const PolicyScryptKDFExecutor = {
    /**
     * Simulates the execution of the PolicyScryptKDFUtility plugin, which handles KDF according to policy.
     * We must maintain the functional implementation here to ensure the Node.js module remains executable, 
     * but the conceptual design relies on the plugin logic.
     * 
     * NOTE: This implementation now uses async/await and util.promisify for cleaner execution,
     * assuming the injected 'scryptPrimitive' is the standard Node.js callback function.
     * 
     * @param {{password: string, salt: Buffer, policyKDF: Object, scryptPrimitive: Function}} args 
     * @returns {Promise<Buffer>}
     */
    execute: async (args) => {
        const { password, salt, policyKDF, scryptPrimitive } = args;
        
        if (!scryptPrimitive) {
            throw new Error("Scrypt primitive (crypto.scrypt) must be injected.");
        }

        const { COST_N, COST_R, COST_P, KEY_LENGTH_BYTES } = policyKDF;
        
        // Since 'scryptPrimitive' is injected, we use util.promisify on it to handle asynchronous execution cleanly.
        const executeScrypt = util.promisify(scryptPrimitive);

        return executeScrypt(
            password,
            salt,
            KEY_LENGTH_BYTES,
            { N: COST_N, r: COST_R, p: COST_P }
        );
    }
}

/**
 * CryptoService v1.2
 * Central utility for all cryptographic operations, enforcing SecurityPolicy standards,
 * delegating complex KDF tasks to specialized tooling (PolicyScryptKDFUtility).
 */
class CryptoService {

    /**
     * Generates a secure random buffer of specified length, defaulting to Policy standards.
     * @param {number} [bytes=Policy.KDF.SALT_LENGTH_BYTES] - Length of the buffer in bytes.
     * @returns {Buffer}
     */
    static generateSalt(bytes = Policy.KDF.SALT_LENGTH_BYTES) {
        return crypto.randomBytes(bytes);
    }

    /**
     * Creates a cryptographic hash digest using the Policy's standard INTEGRITY algorithm.
     * @param {string | Buffer} data - Data to hash.
     * @param {BufferEncoding} [encoding=Policy.INTEGRITY.OUTPUT_ENCODING] - Output encoding.
     * @returns {string}
     */
    static hash(data, encoding = Policy.INTEGRITY.OUTPUT_ENCODING) {
        return crypto
            .createHash(Policy.INTEGRITY.ALGORITHM)
            .update(data)
            .digest(encoding);
    }

    /**
     * Performs Key Derivation Function (KDF) using Scrypt parameters defined in the Policy.
     * Delegates execution to the PolicyScryptKDFUtility tool.
     * @param {string} password - The password string.
     * @param {Buffer} salt - Secure salt buffer.
     * @returns {Promise<Buffer>} The derived key buffer.
     */
    static deriveKey(password, salt) {
        const policyKDF = Policy.KDF;
        
        if (policyKDF.ALGORITHM !== 'scrypt') {
            throw new Error(`KDF Algorithm ${policyKDF.ALGORITHM} not yet implemented in service.`);
        }

        // Delegation of policy-enforced, complex, asynchronous KDF logic to the external utility.
        return PolicyScryptKDFExecutor.execute({
            password: password,
            salt: salt,
            policyKDF: policyKDF,
            // Injecting the Node.js primitive required for the utility execution.
            scryptPrimitive: crypto.scrypt 
        });
    }
}

module.exports = CryptoService;