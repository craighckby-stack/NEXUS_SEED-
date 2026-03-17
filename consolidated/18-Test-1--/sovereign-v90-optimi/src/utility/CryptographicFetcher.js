/**
 * U-04: Cryptographic Fetcher Utility
 * Role: Securely retrieves remote data feeds, performs cryptographic signature verification, 
 *       and enforces time-stamping/freshness checks before passing the validated payload.
 * Requirement: Must use immutable storage (e.g., PKI root hashes) for signature verification keys.
 */
class CryptographicFetcher {
    #http;
    #KeyRing;
    #SignedPayloadValidatorUtility;

    /**
     * @param {Object} config
     * @param {Object} config.httpService - Low-level HTTP client (e.g., Axios instance). Must support async get(url).
     * @param {Object} config.KeyRing - Access to necessary public keys/signature verification utilities. Must support async verify(payload, signature).
     * @param {Object} config.SignedPayloadValidatorUtility - Injected tool for verification. Must support async execute({ rawData, verifyFunction }).
     */
    constructor({ httpService, KeyRing, SignedPayloadValidatorUtility }) {
        if (!httpService || !KeyRing || !SignedPayloadValidatorUtility) {
            throw new Error("CryptographicFetcher: Missing required dependencies (httpService, KeyRing, or SignedPayloadValidatorUtility).");
        }

        this.#http = httpService;
        this.#KeyRing = KeyRing;
        this.#SignedPayloadValidatorUtility = SignedPayloadValidatorUtility;
    }

    /**
     * Fetches a governance policy feed, verifies its authenticity, and returns the parsed object.
     * @param {string} url
     * @returns {Promise<Object>} Object containing mandates and a verifiable 'tag'.
     */
    async fetch(url) {
        let response;
        
        // 1. Secure Data Retrieval (Transport Layer)
        try {
            response = await this.#http.get(url);
        } catch (error) {
            // Explicitly catch and wrap transport/network errors, crucial for security context.
            throw new Error(`CryptographicFetcher: Transport failure retrieving data from ${url}. Details: ${error.message}`);
        }

        // 2. Basic Response Integrity Check
        if (!response || !response.data) {
            throw new Error(`CryptographicFetcher: Received empty or malformed response structure from ${url}.`);
        }
        
        const rawData = response.data;
        
        // 3. Create the specific verification function using the private KeyRing
        // This closure ensures the KeyRing dependency is correctly scoped for the validator utility.
        const verificationFunction = (payload, signature) => this.#KeyRing.verify(payload, signature);
        
        // 4. Delegate structural validation, cryptographic verification, and parsing to the utility
        const verifiedData = await this.#SignedPayloadValidatorUtility.execute({
            rawData: rawData,
            verifyFunction: verificationFunction
        });

        // Return verified data structure
        return verifiedData;
    }
}

module.exports = CryptographicFetcher;