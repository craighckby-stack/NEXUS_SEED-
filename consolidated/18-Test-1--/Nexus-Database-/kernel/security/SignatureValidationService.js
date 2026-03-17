/**
 * Signature Validation Service (SVS)
 * Responsible for cryptographic verification of transition requests and associated credentials.
 * Decouples cryptographic validation logic from SMC protocol enforcement by relying on external engines.
 */
class SignatureValidationService {

    /**
     * Initializes the service with necessary dependencies.
     * @param {object} dependencies
     * @param {object} dependencies.keyIdentityResolver - Service to map public keys/IDs to known system roles.
     * @param {object} dependencies.cryptoEngine - Interface for cryptographic operations (hashing, signature verification, canonicalization).
     */
    constructor({ keyIdentityResolver, cryptoEngine }) {
        if (!keyIdentityResolver || !cryptoEngine) {
            throw new Error("SignatureValidationService requires keyIdentityResolver and cryptoEngine.");
        }
        this.keyIdentityResolver = keyIdentityResolver;
        this.cryptoEngine = cryptoEngine;
    }

    /**
     * Internal method to create a deterministic, canonical representation of the request for signing.
     * MUST use a standardized canonical format (e.g., JCS, Canonical JSON) to guarantee integrity and determinism.
     * @param {object} request - The original transition request data.
     * @returns {string} The canonicalized message payload.
     */
    _canonicalizeRequest(request) {
        return this.cryptoEngine.canonicalize(request);
    }

    /**
     * Verifies if a given command/transition request was correctly signed by the required entity/entities.
     * @param {object} request - The original transition request data.
     * @param {object[]} signatures - Array of signatures provided with the request (must include publicKey/keyId and signature).
     * @param {Set<string>} requiredRoles - The set of roles whose signature is necessary for governance.
     * @returns {{verified: boolean, invalidSigners: string[], validRoles: Set<string>, missingRequiredRoles: Set<string>}}
     */
    verifyRequestSignatures(request, signatures, requiredRoles) {
        const validRoles = new Set();
        // Stores roles required for the transition that provided a cryptographically invalid signature.
        const requiredRoleFailures = new Set(); 

        if (!signatures || signatures.length === 0) {
            const missingRequiredRoles = new Set(requiredRoles);
            return { verified: requiredRoles.size === 0, invalidSigners: [], validRoles, missingRequiredRoles };
        }

        const messageToVerify = this._canonicalizeRequest(request);

        for (const sig of signatures) {
            if (!sig.publicKey || !sig.signature) continue;

            // 1. Identify signer role using the dedicated resolver
            const role = this.keyIdentityResolver.resolveRoleFromKey(sig.publicKey);

            const isRequiredRole = role && requiredRoles.has(role);

            if (!role) {
                // Key is unknown. Ignore signature for validation purposes.
                continue;
            }

            try {
                // 2. Execute cryptographic verification
                const isValid = this.cryptoEngine.verifySignature(messageToVerify, sig.signature, sig.publicKey);

                if (isValid) {
                    validRoles.add(role);
                } else if (isRequiredRole) {
                    // Signature provided by a required role failed cryptographic check.
                    requiredRoleFailures.add(role);
                } 
            } catch (e) {
                // Handle potential errors like malformed keys or crypto engine failure
                console.error(`[SVS] Error during cryptographic verification for role ${role}:`, e.message);
                if (isRequiredRole) {
                    requiredRoleFailures.add(role);
                }
            }
        }

        // Determine which required roles are missing (did not provide a valid signature)
        const missingRequiredRoles = new Set(Array.from(requiredRoles).filter(
            r => !validRoles.has(r)
        ));

        // Final verification check: all required roles must be satisfied and none must have failed cryptographically.
        const requirementsMet = missingRequiredRoles.size === 0 && requiredRoleFailures.size === 0;
        
        return {
            verified: requirementsMet,
            // Return the full list of required roles that explicitly failed signing
            invalidSigners: Array.from(requiredRoleFailures),
            validRoles,
            missingRequiredRoles
        };
    }
}

module.exports = SignatureValidationService;
