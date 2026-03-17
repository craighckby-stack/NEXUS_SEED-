const { isFunction, isObject } = require('util');
const { promisify } = require('util');
const fetch = promisify(require('node-fetch'));

/**
 * GovernanceAuthorizationService (GAS)
 * Mission: Validate security contexts against predefined Governance Control Objectives (GCO) 
 *          and operational policy vectors (e.g., P-01 requirements).
 *
 * This service is critical for enforcing read/write restrictions on high-level operational artifacts (SCR).
 */
class GovernanceAuthorizationService {

    constructor(policyEngine, securityContextVerifier, { apiEndpoint = 'https://governance-service.example.com/api' } = {}) {
        // Policy Engine holds current P-01 vectors and operational mandates
        this.policyEngine = policyEngine;
        // SCV handles token decryption, signature verification, and identity extraction
        this.scv = securityContextVerifier;
        // Set the API endpoint for governance service
        this.apiEndpoint = apiEndpoint;
    }

    async verifySecurityContext(context) {
        if (!context || Object.keys(context).length === 0) {
            throw new Error(`Authorization check failed: No context provided.`);
        }

        const validatedIdentity = await this.scv.verifyContext(context);
        if (!validatedIdentity) {
            throw new Error(`Authentication failed for context: ${JSON.stringify(context)}`);
        }

        // 1. Fetch the required mandate criteria from the Policy Engine
        const requiredCriteria = this.policyEngine.getMandateCriteria('L4_P01_PASS');
        
        // 2. Evaluate if the identity satisfies the criteria (Simplified Check)
        if (!validatedIdentity.roles || validatedIdentity.roles.indexOf('AGI_GOVERNOR') === -1) {
            throw new Error(`Security Clearance Level 'L4_P01_PASS' is not granted to user.`);
        }
        
        if (!validatedIdentity.p01Status || validatedIdentity.p01Status !== 'CLEARED') {
            throw new Error(`Security Clearance Level 'L4_P01_PASS' is not granted to user.`);
        }

        return validatedIdentity;
    }

    async performSecurityAudit(requiredLevel, context) {
        try {
            const validatedIdentity = await this.verifySecurityContext(context);
            const response = await this.invokeGovernanceApi({ level: requiredLevel });
            return { isAuthorized: response && response.level === requiredLevel };
        } catch (error) {
            console.error(`Authorization Error: ${error.message}`);
            return false;
        }
    }

    async invokeGovernanceApi({ level }) {
        const response = await fetch(`${this.apiEndpoint}/governance/validate/security/context`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ securityLevel: level }),
            json: true
        });

        if (!response.ok) {
            throw new Error(`Invalid Governance API Response: ${response.status} ${response.statusText}`);
        }

        return response;
    }
}

module.exports = GovernanceAuthorizationService;