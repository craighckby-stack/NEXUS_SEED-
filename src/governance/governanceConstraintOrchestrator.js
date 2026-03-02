const GovConstants = require('./governanceConstants');

/**
 * Component: Governance Constraint Orchestrator (GCO)
 * ID: GCO-v94.3 (Minor iteration for refined constraint handling)
 * Alignment: GSEP Stage 0/1 Intermediary.
 * Focus: Integrity barrier ensuring all policy-level modifications adhere strictly to the GSEP lifecycle and require
 *        immediate RSAM pre-attestation using the M-01 intent standard for critical targets.
 */
class GovernanceConstraintOrchestrator {
    
    /**
     * @param {IRSAMService} rsam - Risk & Security Attestation Manager
     * @param {SystemRouter} router - System router for GSEP stage progression
     * @param {PolicyIntentFactory} intentFactory - Specialized factory for M-01 package creation
     * @param {IntentSchemaValidator} [validator] - Optional payload validator utility (Recommended)
     */
    constructor(rsam, router, intentFactory, validator = null) {
        // Step 0: Robust dependency enforcement
        if (!rsam) throw new Error("GCO Dependency Error: Missing RSAM Service.");
        if (!router) throw new Error("GCO Dependency Error: Missing System Router.");
        if (!intentFactory) throw new Error("GCO Dependency Error: Missing Policy Intent Factory.");

        this.rsam = rsam; 
        this.router = router; 
        this.intentFactory = intentFactory;
        this.validator = validator; // Use validator if provided

        // Cache critical constants for faster lookup
        this.CRITICAL_TARGETS_LIST = GovConstants.CRITICAL_GOV_TARGETS || [];
        this.GSEP_STAGES_MAP = GovConstants.GSEP_STAGES || {};

        // Define expected stage destinations based on the constant map structure
        this.STAGE_0_VETTING = this.GSEP_STAGES_MAP.STAGE_0_VETTING;
        this.STAGE_1_SCOPE = this.GSEP_STAGES_MAP.STAGE_1_SCOPE;

        if (!this.STAGE_1_SCOPE || !this.STAGE_0_VETTING) {
             console.warn("GCO Init Warning: GSEP stage map incomplete. Critical routing may fail.");
        }
    }

    /**
     * Pre-checks and standardizes the raw request payload structure using the integrated validator 
     * or minimal internal checks if no dedicated validator is present.
     * @param {MutationIntentPayload} rawRequest
     * @returns {MutationIntentPayload} Validated and standardized payload
     * @throws {Error} if payload is fundamentally invalid
     */
    _standardizeAndValidatePayload(rawRequest) {
        if (this.validator) {
            // Leverage dedicated validator if available
            return this.validator.validateMutationIntent(rawRequest);
        }

        // Fallback minimal internal validation
        if (!rawRequest || typeof rawRequest !== 'object' || Array.isArray(rawRequest)) {
            throw new Error("GCO Payload Constraint Violation: Request must be a standard intent object.");
        }
        
        // Ensure targets array exists for constraint checking efficiency
        if (!Array.isArray(rawRequest.targets)) {
             rawRequest.targets = []; 
        }
        return rawRequest;
    }

    /**
     * Step 1: Detect if the mutation intent targets critical governance policies using component IDs.
     * @param {MutationIntentPayload} request - Assumed standardized payload.
     * @returns {boolean} True if critical targets are affected.
     */
    _isTargetingCriticalPolicy(request) {
        // Using cached list for efficient array check
        if (this.CRITICAL_TARGETS_LIST.length === 0) {
            return false; // Cannot check constraints if no targets defined
        }

        return request.targets.some(target => 
            target && target.componentID && this.CRITICAL_TARGETS_LIST.includes(target.componentID)
        );
    }
    
    /**
     * Handles the complex, mandatory pipeline for critical policy modifications:
     * M-01 Intent Creation -> RSAM Pre-Attestation -> Prioritized Routing (Stage 1).
     * @param {MutationIntentPayload} validatedRequest 
     * @returns {Promise<Object>} Standardized critical routing decision.
     * @throws {Error} if routing fails or attestation fails (RSAM handles internal retry logic, GCO handles routing failure)
     */
    async _processCriticalRoute(validatedRequest) {
         if (!this.STAGE_1_SCOPE) {
             throw new Error("GCO Critical Route Error: GSEP Stage 1 (Scope) destination is undefined.");
         }
        
         // 1. Create specialized high-risk intent package (M-01)
         const m01IntentPackage = this.intentFactory.createM01Intent(validatedRequest);

         // 2. Mandatory RSAM Pre-Attestation Registration. Awaiting ensures constraint is met before routing.
         await this.rsam.registerPolicyIntent(m01IntentPackage);
        
         // 3. Force route directly to GSEP Stage 1 (Scope) with maximum priority flag.
         const routeResult = await this.router.prioritizeRoute(this.STAGE_1_SCOPE, m01IntentPackage.id);

         // Return high-fidelity routing data
         return {
             routePath: routeResult.path,
             intentId: m01IntentPackage.id,
             status: 'ROUTE_CRITICAL_GOVERNANCE',
             targetType: 'HIGH_GOVERNANCE_POLICY',
             attestationRequired: true
         };
    }

    /**
     * Primary entry point. Evaluates the intent payload and routes it based on constraint checks.
     * 
     * @param {MutationIntentPayload} rawRequest - The input request containing targets and proposed changes.
     * @returns {Promise<Object>} Standardized routing decision payload.
     */
    async evaluateAndRoute(rawRequest) {
        try {
            // Robustness: Input validation and standardization (v94.3 improvement)
            const validatedRequest = this._standardizeAndValidatePayload(rawRequest);

            if (this._isTargetingCriticalPolicy(validatedRequest)) {
                return this._processCriticalRoute(validatedRequest);
            }

            // Standard route handling: Non-critical policies go to Stage 0 Vetting
            if (!this.STAGE_0_VETTING) {
                 throw new Error("GCO Standard Route Error: GSEP Stage 0 (Vetting) destination is undefined.");
            }
            
            // Standard asynchronous routing
            const standardRoute = await this.router.route(this.STAGE_0_VETTING, validatedRequest);
            
            return {
                routePath: standardRoute.path,
                intentId: null, // No M-01 intent created for standard route
                status: 'ROUTE_STANDARD_CHANGE',
                targetType: 'GENERAL_SYSTEM_CHANGE',
                attestationRequired: false // Attestation may happen later in GSEP stages
            };
        } catch (error) {
            // Centralized error handling for GCO constraints
            throw new Error(`GCO Constraint Orchestration Failure: ${error.message}`);
        }
    }
}

module.exports = GovernanceConstraintOrchestrator;