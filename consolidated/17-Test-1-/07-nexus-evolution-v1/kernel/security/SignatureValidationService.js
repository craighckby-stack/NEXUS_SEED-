/**
 * Signature Validation Service (SVS)
 * Responsible for cryptographic verification of transition requests and associated credentials.
 * Decouples cryptographic validation logic from SMC protocol enforcement.
 */
class SignatureValidationService {

    /**
     * Initializes the service, typically loading cryptographic libraries or key registries.
     * @param {object} keyRegistry - Map of known public keys associated with roles.
     */
    constructor(keyRegistry) {
        this.keyRegistry = keyRegistry || {};
        // NOTE: In production, this would initialize external HSM/crypto interfaces.
    }

    /**
     * Verifies if a given command/transition request was correctly signed by the required entity/entities.
     * Optimized for maximum computational efficiency by minimizing redundant cryptographic operations
     * and leveraging early role validation checks.
     *
     * @param {object} request - The original transition request data.
     * @param {object[]} signatures - Array of signatures provided with the request.
     * @param {Set<string>} requiredRoles - The set of roles whose signature is necessary for governance.
     * @returns {{verified: boolean, invalidSigners: string[], validRoles: Set<string>}}
     */
    verifyRequestSignatures(request, signatures, requiredRoles) {
        const validRoles = new Set();
        const invalidSigners = [];

        // Edge case: If no signatures are provided, verification is only trivially true if no roles were required.
        if (!signatures || signatures.length === 0) {
            return { 
                verified: requiredRoles.size === 0,
                invalidSigners: [],
                validRoles 
            };
        }

        // Computational Optimization 1: Serialize the message payload once.
        const messageToVerify = this._serializeRequest(request);

        // Iterate through all signatures provided.
        for (const sig of signatures) {
            const role = this._resolveRoleFromSignatureKey(sig.publicKey);

            // Optimization 2: Skip immediately if the role is unknown or irrelevant.
            if (!role || !requiredRoles.has(role)) {
                continue;
            }

            // Optimization 3: Skip redundant cryptographic verification if this required role
            // has already been successfully validated by a previous signature.
            if (validRoles.has(role)) {
                continue;
            }

            let isValid = false;
            try {
                // Computational Bottleneck: The cryptographic verification.
                isValid = this._cryptoVerify(messageToVerify, sig.signature, sig.publicKey);
            } catch (e) {
                // Treat any cryptographic failure as invalid.
                console.error(`SVS: Error during verification for required role ${role}:`, e.message);
            }

            if (isValid) {
                validRoles.add(role);
            } else {
                // Record the failure associated with a required role.
                invalidSigners.push(role); 
            }
        }

        // Per contract: Verified is true only if there were zero invalid signatures found.
        return {
            verified: invalidSigners.length === 0,
            invalidSigners,
            validRoles
        };
    }

    /**
     * Stubs for internal cryptographic operations (actual implementation depends on chosen crypto library).
     */
    _serializeRequest(request) {
        // Uses stable, sorted JSON keys for deterministic serialization, crucial for security integrity.
        return JSON.stringify({
            command: request.command,
            current: request.current,
            target: request.target
        });
    }

    _resolveRoleFromSignatureKey(publicKey) {
        // Lookup the role associated with the public key (e.g., from this.keyRegistry)
        // Stub assumes O(1) lookup via an efficient map structure.
        return 'GOVERNANCE_AGENT'; // Stub
    }

    _cryptoVerify(data, signature, publicKey) {
        // Implement ECDSA or comparable signature verification (O(n) where n is data size).
        return true; // Stub
    }
}

module.exports = SignatureValidationService;