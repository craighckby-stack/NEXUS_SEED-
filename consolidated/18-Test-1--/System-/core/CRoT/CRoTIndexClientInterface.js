/**
 * @fileoverview Defines the required interface for any CRoT Index Client implementation.
 * This standardizes the contract for persistence services handling CRoT policy anchors.
 */

/**
 * @interface
 * @typedef {object} ICRoTIndexClient
 * @property {function(string): Promise<string[]>} getAnchorsByFingerprint - Retrieves a list of transaction IDs (ACV Anchors) associated with a given policy fingerprint.
 * @property {function(string, string): Promise<void>} indexCommit - Stores a new ACV Anchor (transaction ID) linked to its policy fingerprint.
 */
class ICRoTIndexClient {
    /**
     * @param {string} fingerprint The 64-character SHA-256 policy hash.
     * @returns {Promise<string[]>} List of historical ACV transaction IDs.
     */
    async getAnchorsByFingerprint(fingerprint) {
        throw new Error('Method must be implemented by the concrete CRoT Index Client.');
    }

    /**
     * @param {string} fingerprint The 64-character SHA-256 policy hash.
     * @param {string} txId The transaction ID (Anchor) associated with the successful policy change.
     * @returns {Promise<void>}
     */
    async indexCommit(fingerprint, txId) {
        throw new Error('Method must be implemented by the concrete CRoT Index Client.');
    }
}

module.exports = { ICRoTIndexClient };