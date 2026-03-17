/**
 * Required Tool Kernel Interfaces (Existing and Strategic)
 */

interface ILoggerToolKernel { 
    warn(message: string, context?: object): void; 
    error(message: string, context?: object): void; 
}

interface IGovernanceConstantsV2ConfigRegistryKernel {
    getCriticalGovTargets(): Promise<string[]>;
    getGsepStages(): Promise<{ [key: string]: string }>;
}

interface ISpecValidatorKernel {
    // Assumes a general validation method that throws on failure
    validate(payload: any, schemaId: string): void;
}

interface IRiskAttestationManagerToolKernel { 
    registerPolicyIntent(intent: any): Promise<void>; 
}

interface IGovernanceStageRouterToolKernel { 
    prioritizeRoute(destination: string, payload: any): Promise<{ path: string }>; 
    route(destination: string, payload: any): Promise<{ path: string }>; 
}

interface IMutationIntentFactoryToolKernel { 
    createM01Intent(payload: any): any; 
}

interface IDeepPropertyInclusionCheckerToolKernel {
    execute(haystackArray: any[], needleList: string[], propertyPath: string): boolean;
}

interface MutationIntentPayload { targets: Array<{ componentID: string }>; }

/**
 * Component: Governance Constraint Orchestrator Kernel (GCO-K)
 * ID: GCO-K-v1.0.0
 * Alignment: AIA Enforcement Layer - Constraint Management.
 * Focus: Integrity barrier ensuring all policy-level modifications adhere strictly to the GSEP lifecycle and require
 *        immediate RSAM pre-attestation using the M-01 intent standard for critical targets.
 */
class GovernanceConstraintOrchestratorKernel {
    private rsam: IRiskAttestationManagerToolKernel;
    private router: IGovernanceStageRouterToolKernel;
    private intentFactory: IMutationIntentFactoryToolKernel;
    private specValidator: ISpecValidatorKernel | null;
    private criticalityChecker: IDeepPropertyInclusionCheckerToolKernel;
    private configRegistry: IGovernanceConstantsV2ConfigRegistryKernel;
    private logger: ILoggerToolKernel;

    private CRITICAL_TARGETS_LIST: string[] = [];
    private STAGE_0_VETTING: string | null = null;
    private STAGE_1_SCOPE: string | null = null;
    
    /**
     * @param {IRiskAttestationManagerToolKernel} rsam - Risk Attestation Manager
     * @param {IGovernanceStageRouterToolKernel} router - GSEP Stage Router
     * @param {IMutationIntentFactoryToolKernel} intentFactory - Specialized factory for M-01 package creation
     * @param {IDeepPropertyInclusionCheckerToolKernel} criticalityChecker - Plugin for deep list comparison
     * @param {IGovernanceConstantsV2ConfigRegistryKernel} configRegistry - Asynchronous constant provider
     * @param {ILoggerToolKernel} logger - Auditable Logger
     * @param {ISpecValidatorKernel} [specValidator] - Optional payload validator utility
     */
    constructor(
        rsam: IRiskAttestationManagerToolKernel, 
        router: IGovernanceStageRouterToolKernel, 
        intentFactory: IMutationIntentFactoryToolKernel, 
        criticalityChecker: IDeepPropertyInclusionCheckerToolKernel,
        configRegistry: IGovernanceConstantsV2ConfigRegistryKernel,
        logger: ILoggerToolKernel,
        specValidator: ISpecValidatorKernel | null = null
    ) {
        // Dependencies are injected, eliminating synchronous dependency checks from constructor body.
        this.rsam = rsam; 
        this.router = router; 
        this.intentFactory = intentFactory;
        this.criticalityChecker = criticalityChecker;
        this.configRegistry = configRegistry;
        this.logger = logger;
        this.specValidator = specValidator; 
    }
    
    /**
     * Asynchronously loads governance constants (CRITICAL_TARGETS, GSEP_STAGES) into the kernel state.
     * This replaces synchronous GovConstants loading.
     */
    public async initialize(): Promise<void> {
        try {
            const [targets, stages] = await Promise.all([
                this.configRegistry.getCriticalGovTargets(),
                this.configRegistry.getGsepStages()
            ]);
            
            this.CRITICAL_TARGETS_LIST = targets || [];
            
            // Define expected stage destinations
            this.STAGE_0_VETTING = stages.STAGE_0_VETTING || null;
            this.STAGE_1_SCOPE = stages.STAGE_1_SCOPE || null;
            
            if (!this.STAGE_1_SCOPE || !this.STAGE_0_VETTING) {
                 this.logger.warn("GCO-K Initialization Warning: GSEP stage map incomplete. Critical routing may fail.", {
                     stage0: this.STAGE_0_VETTING,
                     stage1: this.STAGE_1_SCOPE
                 });
            }
        } catch (error) {
            // Use auditable logger and throw structured error (GOV_E_005: Config Load Failure)
            this.logger.error("GCO-K Initialization Failure: Could not load governance constants.", { error });
            throw new Error(`GCO-K Init Error (GOV_E_005): Failed to load necessary governance configuration.`);
        }
    }

    /**
     * Pre-checks and standardizes the raw request payload structure.
     * @param {MutationIntentPayload} rawRequest
     * @returns {MutationIntentPayload} Validated and standardized payload
     * @throws {Error} if payload is fundamentally invalid
     */
    private _standardizeAndValidatePayload(rawRequest: MutationIntentPayload): MutationIntentPayload {
        if (this.specValidator) {
            try {
                // Use ISpecValidatorKernel to validate against a known schema ID
                this.specValidator.validate(rawRequest, 'MutationIntentSchemaID'); 
                return rawRequest; 
            } catch (e) {
                // GOV_E_006: Schema Validation Failure
                throw new Error("GCO-K Payload Constraint Violation (GOV_E_006): Input failed schema validation.");
            }
        }

        // Fallback minimal internal validation
        if (!rawRequest || typeof rawRequest !== 'object' || Array.isArray(rawRequest)) {
            // GOV_E_007: Basic Structure Violation
            throw new Error("GCO-K Payload Constraint Violation (GOV_E_007): Request must be a standard intent object.");
        }
        
        if (!Array.isArray(rawRequest.targets)) {
             rawRequest.targets = []; 
        }
        return rawRequest;
    }

    /**
     * Step 1: Detect if the mutation intent targets critical governance policies.
     */
    private _isTargetingCriticalPolicy(request: MutationIntentPayload): boolean {
        return this.criticalityChecker.execute(
            request.targets,
            this.CRITICAL_TARGETS_LIST,
            'componentID'
        );
    }
    
    /**
     * Handles the mandatory M-01 Intent Creation -> RSAM Pre-Attestation -> Prioritized Routing pipeline.
     */
    private async _processCriticalRoute(validatedRequest: MutationIntentPayload): Promise<object> {
         if (!this.STAGE_1_SCOPE) {
             // GOV_E_008: Stage Configuration Missing
             throw new Error("GCO-K Critical Route Error (GOV_E_008): GSEP Stage 1 (Scope) destination is undefined. Check initialization.");
         }
        
         // 1. Create specialized high-risk intent package (M-01)
         const m01IntentPackage = this.intentFactory.createM01Intent(validatedRequest);

         // 2. Mandatory RSAM Pre-Attestation Registration
         await this.rsam.registerPolicyIntent(m01IntentPackage);
        
         // 3. Force route directly to GSEP Stage 1 (Scope) with maximum priority flag.
         const routeResult = await this.router.prioritizeRoute(this.STAGE_1_SCOPE, m01IntentPackage.id);

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
     */
    public async evaluateAndRoute(rawRequest: MutationIntentPayload): Promise<object> {
        // Mandatory state check ensures initialization occurred
        if (!this.STAGE_0_VETTING) {
             throw new Error("GCO-K State Error (GOV_E_009): Kernel not initialized. Configuration missing.");
        }
        
        try {
            const validatedRequest = this._standardizeAndValidatePayload(rawRequest);

            if (this._isTargetingCriticalPolicy(validatedRequest)) {
                return this._processCriticalRoute(validatedRequest);
            }

            // Standard route handling: Non-critical policies go to Stage 0 Vetting
            
            // Standard asynchronous routing
            const standardRoute = await this.router.route(this.STAGE_0_VETTING, validatedRequest);
            
            return {
                routePath: standardRoute.path,
                intentId: null, 
                status: 'ROUTE_STANDARD_VETTING',
                targetType: 'STANDARD_GOVERNANCE_POLICY',
                attestationRequired: false
            };
        } catch (error) {
            // Auditable logging of routing failure
            this.logger.error("GCO-K Route Evaluation Failed.", { rawRequest, error: error.message, conceptId: error.conceptId || 'GOV_E_010' });
            throw error; 
        }
    }
}