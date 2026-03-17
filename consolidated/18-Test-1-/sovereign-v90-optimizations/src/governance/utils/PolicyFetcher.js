import { ISecurePolicyLoaderToolKernel, CryptoPolicyValidatorKernel, IErrorDetailNormalizationToolKernel } from "tool_kernels";

/**
 * @interface VerificationScheme
 * @property {string} type - The verification standard (e.g., 'JWT', 'PGP', 'JWS').
 * @property {string} publicKeyId - Identifier for the key to use for verification.
 * @property {string} [expectedIssuer] - Optional expected issuer for the signature.
 */

/**
 * PolicyFetcherKernel is responsible for securely retrieving policy documents,
 * ensuring cryptographic integrity and authenticity by delegating all I/O, decoding,
 * canonicalization, and verification tasks to specialized, high-integrity Tool Kernels.
 * This enforces Maximum Recursive Abstraction (MRA) and non-blocking execution.
 */
class PolicyFetcherKernel {
    private policyLoader: ISecurePolicyLoaderToolKernel;
    private cryptoValidator: CryptoPolicyValidatorKernel;
    private errorNormalizer: IErrorDetailNormalizationToolKernel;

    /**
     * Initializes the PolicyFetcherKernel and its dependencies.
     * @param kernels Essential asynchronous Tool Kernels injected during initialization.
     */
    async initialize({
        policyLoader,
        cryptoValidator,
        errorNormalizer
    }: {
        policyLoader: ISecurePolicyLoaderToolKernel,
        cryptoValidator: CryptoPolicyValidatorKernel,
        errorNormalizer: IErrorDetailNormalizationToolKernel
    }): Promise<void> {
        this.policyLoader = policyLoader;
        this.cryptoValidator = cryptoValidator;
        this.errorNormalizer = errorNormalizer;
        
        // Mandatory initialization of dependencies
        await this.policyLoader.initialize();
        await this.cryptoValidator.initialize();
        await this.errorNormalizer.initialize();
    }

    /**
     * Performs a secure fetch operation and verifies the cryptographic integrity
     * of the received policy against its digital signature.
     *
     * @param url The URL to fetch the policy from.
     * @param verificationScheme The required cryptographic verification configuration.
     * @returns A promise resolving to the verified policy configuration.
     * @throws Error if fetching fails or signature verification fails, formatted by the Error Normalizer.
     */
    public async fetchAndVerifyPolicy(
        url: string,
        verificationScheme: VerificationScheme
    ): Promise<Record<string, any>> {

        if (!url) {
            throw await this.errorNormalizer.formatError({
                type: 'ValidationError',
                message: "Policy URL must be provided."
            });
        }
        if (!verificationScheme || !verificationScheme.type) {
            throw await this.errorNormalizer.formatError({
                type: 'ValidationError',
                message: "Verification scheme must be defined for secure fetching."
            });
        }

        let responseData: { policy: any, signature: string };
        try {
            // 1. Secure Fetching and Decoding (Delegated)
            // ISecurePolicyLoaderToolKernel handles external I/O, secure TLS transport, and response parsing.
            responseData = await this.policyLoader.loadResource({
                url: url,
                resourceType: 'PolicyEnvelope'
            });

        } catch (error) {
            throw await this.errorNormalizer.formatError({
                type: 'PolicyFetchError',
                message: `Failed to securely fetch policy from ${url}.`,
                details: error
            });
        }

        const { policy, signature } = responseData;

        if (!policy || !signature) {
            throw await this.errorNormalizer.formatError({
                type: 'PolicyIntegrityError',
                message: "Fetched payload is incomplete. Missing policy structure or digital signature."
            });
        }

        // 2. Digital Signature Verification (Delegated)
        // CryptoPolicyValidatorKernel handles canonicalization, cryptographic checking, and key validation.
        const verificationResult = await this.cryptoValidator.validatePolicyIntegrity({
            payload: policy,
            signature: signature,
            verificationConfig: verificationScheme
        });

        if (!verificationResult.verified) {
            throw await this.errorNormalizer.formatError({
                type: 'PolicyVerificationError',
                message: `Policy integrity verification failed for policy at ${url}.`,
                details: verificationResult.message
            });
        }

        // 3. Return the verified policy
        // Logging/Auditing must be handled by MultiTargetAuditDisperserToolKernel if required.
        return policy;
    }
}

export default PolicyFetcherKernel;