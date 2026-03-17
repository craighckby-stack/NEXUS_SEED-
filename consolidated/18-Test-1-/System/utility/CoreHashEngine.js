/**
 * CoreHashEngine.js
 * Provides canonical JSON serialization and SHA-256 hashing for GSC proposals.
 * This utility is critical for generating reproducible 'integrity_checksum' values.
 */

const { createHash } = require('crypto');

// Defines fields that must be excluded or reset before hashing the proposal itself.
const EXCLUDED_FIELDS = ['integrity_checksum', 'signatures', 'verification_data'];

/**
 * Canonicalizes the JSON object for deterministic hashing (required for consensus).
 * Standard method: Lexicographically sorted keys, no whitespace.
 * @param {object} obj The proposal object.
 * @returns {string} Canonicalized JSON string.
 */
function canonicalize(obj) {
    // Note: The current implementation simulates the required structure using built-in methods.
    
    // Deep clone and clean object first
    const workingObject = JSON.parse(JSON.stringify(obj));

    EXCLUDED_FIELDS.forEach(field => {
        delete workingObject[field];
    });
    
    // Use standard sort-key stringify for canonical output
    // Implementation must guarantee byte-for-byte reproducibility across runtime environments.
    return JSON.stringify(workingObject, Object.keys(workingObject).sort());
}

/**
 * Calculates the integrity checksum for a given GSC proposal.
 * @param {object} proposal The raw GSC proposal object.
 * @returns {string} The SHA-256 integrity hash string.
 */
function calculateProposalChecksum(proposal) {
    const canonicalData = canonicalize(proposal);
    return createHash('sha256').update(canonicalData, 'utf8').digest('hex');
}

module.exports = {
    calculateProposalChecksum,
    // canonicalize is kept private unless explicitly needed for external access
};
