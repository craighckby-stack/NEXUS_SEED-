const policy = require('../policies/config/crypto_policy.json');

/**
 * CryptoPolicyValidator V1.0
 * Ensures runtime configuration compliance against the Sovereign AGI crypto policy.
 */
class CryptoPolicyValidator {

    constructor(policyConfig) {
        this.policy = policyConfig;
    }

    /**
     * Validates if a provided hash algorithm meets current standards.
     * @param {string} algorithmName - e.g., 'SHA-256'
     * @param {number} digestSizeBits - e.g., 256
     */
    isHashCompliant(algorithmName, digestSizeBits) {
        const h = this.policy.hashingPolicy;
        
        if (digestSizeBits < h.minDigestLengthBits) {
            return { compliant: false, reason: `Digest length (${digestSizeBits}) is below required minimum (${h.minDigestLengthBits}).` };
        }

        const algoUpper = algorithmName.toUpperCase().replace('-', '_');
        
        if (h.deprecationStatus[algoUpper]?.status === 'DEPRECATED') {
            return { compliant: false, reason: `${algorithmName} is fully deprecated and forbidden.` };
        }

        if (!h.approvedAlgorithms.includes(algoUpper)) {
            // Allow soft deprecated algorithms if they are specifically exempted/necessary temporarily
            if (h.deprecationStatus[algoUpper]?.status !== 'SOFT_DEPRECATION') {
                 return { compliant: false, reason: `${algorithmName} is not in the approved list.` };
            }
        }

        return { compliant: true, reason: 'Compliant.' };
    }

    /**
     * Validates symmetric cipher configuration (e.g., used for data transport).
     */
    isSymmetricCipherCompliant(algorithm, keySizeBits) {
        const s = this.policy.symmetricPolicy;

        if (s.forbidden.includes(algorithm.toUpperCase())) {
            return { compliant: false, reason: `${algorithm} is explicitly forbidden.` };
        }
        if (keySizeBits < s.minKeySizeBits) {
            return { compliant: false, reason: `Key size (${keySizeBits}) is insufficient.` };
        }

        // Additional checks needed for mode validation (GCM, Chacha20)
        // ...
        return { compliant: true, reason: 'Compliant.' };
    }

    // Implement additional methods for signingPolicy, keyManagement, etc.
}

module.exports = new CryptoPolicyValidator(policy);