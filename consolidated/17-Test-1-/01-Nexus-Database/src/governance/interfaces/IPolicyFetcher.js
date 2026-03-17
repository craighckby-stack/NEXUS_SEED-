/**
 * E-01 Interface: IPolicyFetcher
 * Role: Defines the mandatory interface for any secure dependency injection used by the ExternalPolicyIndex (EPI).
 * 
 * Implementations of this interface MUST handle all aspects of secure communication, including cryptographic verification 
 * (e.g., checking digital signatures, integrity hashes) before resolving.
 */

class IPolicyFetcher {
    /**
     * Fetches and cryptographically verifies the latest governance policies from the external source.
     * 
     * @param {string} sourceUrl - The URL pointing to the governance mandate source.
     * @returns {Promise<{mandates: Object, tag: string}>} A promise resolving to the verified policy mandates object and its version tag.
     * @throws {Error} Throws if fetching fails or if cryptographic verification fails (i.e., data is corrupted or unauthorized).
     */
    async fetch(sourceUrl) {
        throw new Error('IPolicyFetcher: fetch method must be implemented by the dependency.');
    }
}

module.exports = IPolicyFetcher;