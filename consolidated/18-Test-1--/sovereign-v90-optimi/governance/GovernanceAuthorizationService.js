/**
 * GovernanceAuthorizationService (GAS)
 * Mission: Validate security contexts against predefined Governance Control Objectives (GCO) 
 *          and operational policy vectors (e.g., P-01 requirements).
 *
 * This service is critical for enforcing read/write restrictions on high-level operational artifacts (SCR).
 */
class GovernanceAuthorizationService {

    #policyEngine;
    #scv;
    #mandateEvaluator;

    /**
     * @param {object} policyEngine - Handles fetching mandate criteria based on requiredLevel.
     * @param {object} securityContextVerifier - Handles token verification and identity extraction.
     * @param {object} mandateEvaluator - Executes complex governance mandate checks.
     */
    constructor(policyEngine, securityContextVerifier, mandateEvaluator) {
        this.#setupDependencies(policyEngine, securityContextVerifier, mandateEvaluator);
    }

    /**
     * Extracts synchronous dependency assignment and ensures existence.
     * @private
     */
    #setupDependencies(policyEngine, securityContextVerifier, mandateEvaluator) {
        if (!policyEngine || !securityContextVerifier || !mandateEvaluator) {
             throw new Error("Missing required dependencies for GovernanceAuthorizationService.");
        }
        this.#policyEngine = policyEngine;
        this.#scv = securityContextVerifier;
        this.#mandateEvaluator = mandateEvaluator; 
    }

    // --- I/O Proxies: External interactions and Logging ---

    #logError(message) {
        // I/O Proxy for console.error
        console.error(`[GAS] ${message}`);
    }

    #logWarning(message) {
        // I/O Proxy for console.warn
        console.warn(`[GAS] ${message}`);
    }

    async #delegateToSecurityContextVerification(context) {
        // I/O Proxy for external tool execution (SCV)
        return this.#scv.verifyContext(context);
    }
    
    #delegateToPolicyEngine(requiredLevel) {
        // I/O Proxy for external tool execution (Policy Engine data fetch)
        return this.#policyEngine.getMandateCriteria(requiredLevel);
    }

    #delegateToMandateEvaluation(payload) {
        // I/O Proxy for external tool execution (Mandate Evaluator)
        return this.#mandateEvaluator.execute(payload);
    }

    /**
     * Validates if a given context meets the required security clearance level.
     * @param {string} requiredLevel - The threshold (e.g., 'L4_P01_PASS', 'READ_ACCESS').
     * @param {object} context - The operational security context (token, identity, or service credentials).
     * @returns {Promise<boolean>} True if authorization is sufficient.
     */
    async validate(requiredLevel, context) {
        // Input validation
        if (!context || typeof context !== 'object' || Object.keys(context).length === 0) {
            this.#logError(`Validation failure: Required level '${requiredLevel}'. Context is missing or empty.`);
            return false;
        }

        let validatedIdentity;
        try {
            // Step 1: Verify the integrity and authenticity of the context/token
            validatedIdentity = await this.#delegateToSecurityContextVerification(context);
        } catch (error) {
            // Handle failures in the security context pipeline
            this.#logError(`Security Context Verification failed for level ${requiredLevel}. Error: ${error.message}`);
            return false;
        }

        if (!validatedIdentity) {
            // Identity verification returned a falsy value
            this.#logWarning(`Identity verification failed for level ${requiredLevel}. Identity unauthorized or unknown.`);
            return false;
        }

        // Step 2: Fetch the required mandate criteria
        const requiredCriteria = this.#delegateToPolicyEngine(requiredLevel);
        
        // Step 3: Delegate the comprehensive evaluation
        return this.#delegateToMandateEvaluation({
            requiredLevel,
            validatedIdentity,
            requiredCriteria
        });
    }
}

module.exports = GovernanceAuthorizationService;