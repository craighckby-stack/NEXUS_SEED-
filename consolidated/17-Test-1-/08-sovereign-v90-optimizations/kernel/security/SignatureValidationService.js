/**
 * Signature Validation Service (SVS) Impl
 * Responsible for cryptographic verification of transition requests and associated credentials.
 * Decouples cryptographic validation logic from SMC protocol enforcement by relying on external engines.
 */
class SignatureValidationServiceImpl {

    #keyIdentityResolver;
    #cryptoEngine;
    #complianceReporter;
    #contextFactory;

    /**
     * Initializes the service with necessary dependencies.
     * @param {object} dependencies
     * @param {object} dependencies.keyIdentityResolver - Service to map public keys/IDs to known system roles.
     * @param {object} dependencies.cryptoEngine - Interface for cryptographic operations.
     * @param {object} dependencies.complianceReporter - Plugin for general compliance reporting.
     * @param {object} [dependencies.signatureContextFactory] - Optional factory to abstract context creation.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    // --- I/O Proxy and Error Isolation ---

    #throwSetupError(message) {
        throw new Error(`SignatureValidationService Setup Error: ${message}`);
    }

    #delegateToCanonicalize(request) {
        // I/O Proxy for interaction with the cryptographic engine
        return this.#cryptoEngine.canonicalize(request);
    }

    #delegateToCreateContext(messageToVerify) {
        // I/O Proxy for interaction with the context factory
        return this.#contextFactory.createContext(messageToVerify);
    }

    #delegateToComplianceExecution(params) {
        // I/O Proxy for interaction with the compliance reporter tool
        return this.#complianceReporter.execute(params);
    }

    /**
     * Extracts synchronous dependency resolution and initialization logic.
     */
    #setupDependencies({ keyIdentityResolver, cryptoEngine, complianceReporter, signatureContextFactory }) {
        if (!keyIdentityResolver || !cryptoEngine || !complianceReporter) {
            this.#throwSetupError("requires keyIdentityResolver, cryptoEngine, and complianceReporter.");
        }

        this.#keyIdentityResolver = keyIdentityResolver;
        this.#cryptoEngine = cryptoEngine;
        this.#complianceReporter = complianceReporter;

        // Handle context factory setup (Synchronous Setup Goal)
        if (signatureContextFactory) {
            this.#contextFactory = signatureContextFactory;
        } else {
            // Assumes SignatureVerificationContextFactory is available (e.g., imported or required)
            // Synchronous require isolated here.
            const Factory = typeof SignatureVerificationContextFactory !== 'undefined' 
                ? SignatureVerificationContextFactory 
                : require('./SignatureVerificationContextFactory');
            
            this.#contextFactory = new Factory({ keyIdentityResolver, cryptoEngine });
        }
    }

    /**
     * Verifies if a given command/transition request was correctly signed by the required entity/entities.
     * @param {object} request - The original transition request data.
     * @param {object[]} signatures - Array of signatures provided with the request (must include publicKey/keyId and signature).
     * @param {Set<string>} requiredRoles - The set of roles whose signature is necessary for governance.
     * @returns {{verified: boolean, invalidSigners: string[], validRoles: Set<string>, missingRequiredRoles: Set<string>}}
     */
    verifyRequestSignatures(request, signatures, requiredRoles) {
        
        if (!signatures || signatures.length === 0) {
            const missingRequiredRoles = new Set(requiredRoles);
            return { verified: requiredRoles.size === 0, invalidSigners: [], validRoles: new Set(), missingRequiredRoles };
        }

        const messageToVerify = this.#delegateToCanonicalize(request);

        // 1. Abstract generation of ID extraction and validation functions
        const { idExtractor, validator } = this.#delegateToCreateContext(messageToVerify);

        // 2. Utilize the generic compliance reporter with the generated context
        const complianceResult = this.#delegateToComplianceExecution({
            requiredIds: requiredRoles,
            inputList: signatures,
            idExtractor: idExtractor,
            validator: validator
        });

        // Map results back to the domain specific terminology
        return {
            verified: complianceResult.verified,
            // invalidIds maps to invalidSigners
            invalidSigners: complianceResult.invalidIds,
            // validIds maps to validRoles
            validRoles: complianceResult.validIds,
            // missingRequiredIds maps to missingRequiredRoles
            missingRequiredRoles: complianceResult.missingRequiredIds
        };
    }
}

// Preserve original module export API
module.exports = SignatureValidationServiceImpl;
