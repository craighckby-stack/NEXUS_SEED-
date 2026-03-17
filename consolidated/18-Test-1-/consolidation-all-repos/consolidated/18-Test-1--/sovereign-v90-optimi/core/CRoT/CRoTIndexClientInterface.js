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
     * Ensures the class is treated as an abstract interface and cannot be instantiated directly.
     */
    constructor() {
        if (new.target === ICRoTIndexClient) {
            throw new Error("Cannot instantiate abstract interface ICRoTIndexClient directly. It must be extended.");
        }
    }

    /**
     * Private helper to enforce abstract contract fulfillment by throwing a standard error.
     * @param {string} methodName The name of the method that requires implementation.
     */
    #enforceImplementation(methodName) {
        throw new Error(`Method '${methodName}' must be implemented by the concrete CRoT Index Client.`);
    }

    /**
     * @param {string} fingerprint The 64-character SHA-256 policy hash.
     * @returns {Promise<string[]>} List of historical ACV transaction IDs.
     */
    async getAnchorsByFingerprint(fingerprint) {
        this.#enforceImplementation('getAnchorsByFingerprint');
    }

    /**
     * @param {string} fingerprint The 64-character SHA-256 policy hash.
     * @param {string} txId The transaction ID (Anchor) associated with the successful policy change.
     * @returns {Promise<void>} 
     */
    async indexCommit(fingerprint, txId) {
        this.#enforceImplementation('indexCommit');
    }
}

module.exports = { ICRoTIndexClient };