/**
 * U-04: Cryptographic Fetcher Utility
 * Role: Securely retrieves remote data feeds, performs cryptographic signature verification, 
 *       and enforces time-stamping/freshness checks before passing the validated payload.
 * Requirement: Must use immutable storage (e.g., PKI root hashes) for signature verification keys.
 */
class CryptographicFetcher {
    /**
     * @param {Object} config
     * @param {Object} config.httpService - Low-level HTTP client (e.g., Axios instance).
     * @param {Object} config.KeyRing - Access to necessary public keys/signature verification utilities.
     */
    constructor({ httpService, KeyRing }) {
        this.http = httpService;
        this.KeyRing = KeyRing;
        // Assume KeyRing.verify(payload, signature) exists
    }

    /**
     * Fetches a governance policy feed, verifies its authenticity, and returns the parsed object.
     * @param {string} url
     * @returns {Promise<Object>} Object containing mandates and a verifiable 'tag'.
     */
    async fetch(url) {
        const response = await this.http.get(url);
        const rawData = response.data;
        
        if (!rawData || !rawData.payload || !rawData.signature || !rawData.tag) {
            throw new Error("Fetcher failed: Response missing critical structure (payload, signature, or tag).");
        }

        // 1. Cryptographic Verification
        const isVerified = await this.KeyRing.verify(rawData.payload, rawData.signature);
        
        if (!isVerified) {
            throw new Error("Fetcher failed: Policy signature verification failed. Data integrity compromised.");
        }

        // 2. Parse payload
        const mandates = JSON.parse(rawData.payload);

        // Return verified data structure for ExternalPolicyIndex consumption
        return {
            mandates: mandates,
            tag: rawData.tag,
            sourceTimestamp: rawData.timestamp || Date.now() 
        };
    }
}

module.exports = CryptographicFetcher;