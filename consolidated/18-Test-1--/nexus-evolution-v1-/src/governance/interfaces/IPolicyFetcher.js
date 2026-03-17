/**
 * AGI-KERNEL Interface: ISecurePolicyLoaderToolKernel
 * Role: Defines the high-integrity, asynchronous interface for securely fetching and cryptographically
 * verifying external governance policies (E-01). This kernel acts as the trusted gateway for
 * retrieving immutable governance mandates.
 *
 * Implementations of this kernel MUST delegate cryptographic verification (signature checking, integrity hashing)
 * to dedicated, audited Crypto Utility Kernels before resolving the mandates.
 */
class ISecurePolicyLoaderToolKernel {
    /**
     * Asynchronously fetches and cryptographically verifies the latest governance policies from the external source.
     *
     * @param {string} sourceUrl - The secured URL pointing to the governance mandate source (e.g., a Merkle root endpoint).
     * @returns {Promise<{mandates: Readonly<Object<string, any>>, tag: string}>} A promise resolving to the verified, immutable policy mandates object and its version tag (e.g., commit hash or version number).
     * @throws {Error} Throws if fetching fails, network errors occur, or if cryptographic verification fails (e.g., data corruption, unauthorized signature, integrity check failure).
     */
    async fetchVerifiedPolicies(sourceUrl) {
        // AGI-KERNEL Contract Enforcement: This method must be implemented by the concrete dependency.
        throw new Error('AGI-KERNEL Contract Violation: ISecurePolicyLoaderToolKernel::fetchVerifiedPolicies must be implemented.');
    }
}

module.exports = ISecurePolicyLoaderToolKernel;