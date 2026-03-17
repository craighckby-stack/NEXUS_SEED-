// src/utils/cryptoUtils.js

// Assuming CanonicalIntegrityHasher is available via the AGI-KERNEL runtime environment
declare const CanonicalIntegrityHasher: {
    /**
     * Computes a SHA-512 hash of the content, formatted as 'sha512-hashvalue'.
     * @param {string} content - The data content to hash.
     * @returns {string} The computed hash.
     */
    sha512: (content: string) => string;
};

/**
 * Computes the SHA-512 hash of the given content string, formatted as 'sha512-hashvalue'.
 * Delegates hashing responsibility to the CanonicalIntegrityHasher tool.
 * @param {string} content - The data content to hash.
 * @returns {string} The computed hash prefixed by the algorithm name.
 */
const sha512 = (content: string): string => {
    if (typeof content !== 'string') {
        throw new Error("Hash input must be a string.");
    }
    
    try {
        // Delegate the cryptographic operation to the standardized plugin
        return CanonicalIntegrityHasher.sha512(content);
    } catch (e) {
        console.error("Cryptographic operation failure during SHA-512 calculation:", e);
        // Standardized error message for module integration
        throw new Error("Cryptographic hash generation failed.");
    }
};

module.exports = sha512; // Exporting the function directly for integration into CIM.