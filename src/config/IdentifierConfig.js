/**
 * Configuration settings for ID Generation and Integrity Services.
 * Externalizes parameters governing hashing complexity and deterministic behavior.
 */

const IdentifierConfig = {
    // Default algorithm for stable content hashing (e.g., SHA256, SHA512, Blake3)
    DEFAULT_HASH_ALGORITHM: 'SHA256',

    // Encoding for output hashes (e.g., hex, base64)
    HASH_OUTPUT_ENCODING: 'hex',

    // Optional complexity parameter (e.g., rounds for slower hashing or salts)
    COMPLEXITY_FACTOR: 1 
};

module.exports = IdentifierConfig;