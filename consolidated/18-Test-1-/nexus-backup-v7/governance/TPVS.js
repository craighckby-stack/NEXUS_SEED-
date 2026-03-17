// Temporal Policy Versioning Service (TPVS)
// Required for GACMS/IATP zero-trust activation and rollback (GACMS 4.0).

/**
 * Manages the real-time mapping of attested Asset Hashes to their active GSEP-C cycles.
 * @module TPVS
 */

const VERSION_MAP = new Map(); // Key: Asset Type, Value: { currentHash, activationTime, previousHash }

/**
 * Updates the active governance asset hash.
 * @param {string} assetType
 * @param {string} newHash
 * @returns {boolean}
 */
function activatePolicyVersion(assetType, newHash) {
    if (VERSION_MAP.has(assetType)) {
        const current = VERSION_MAP.get(assetType);
        current.previousHash = current.currentHash;
    }
    VERSION_MAP.set(assetType, {
        currentHash: newHash,
        activationTime: Date.now(),
        previousHash: null // Updated above if existent
    });
    return true;
}

/**
 * Retrieves the currently active hash for a given asset type.
 * @param {string} assetType
 * @returns {string | null}
 */
function getActiveHash(assetType) {
    const entry = VERSION_MAP.get(assetType);
    return entry ? entry.currentHash : null;
}

/**
 * Forces an instantaneous rollback to the previously active policy version (IATP requirement 6).
 * @param {string} assetType
 * @returns {string | null} The hash rolled back to.
 */
function rollback(assetType) {
    const entry = VERSION_MAP.get(assetType);
    if (entry && entry.previousHash) {
        const rolledHash = entry.previousHash;
        entry.currentHash = rolledHash;
        entry.previousHash = null; // Clear previous after rollback
        return rolledHash;
    }
    return null;
}

export { activatePolicyVersion, getActiveHash, rollback };
