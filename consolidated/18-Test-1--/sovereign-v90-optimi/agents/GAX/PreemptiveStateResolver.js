/**
 * @typedef {Object} RiskAccessors
 * @property {function(): Object} getUFRM - Function to retrieve the Unforeseen Risk Metric.
 * @property {function(): Object} getCFTM - Function to retrieve the Core Function Trajectory Metric.
 */

/**
 * @typedef {Object} ATMOutput
 * @property {number} predicted_TEMM - Predicted Temporal Metric score (0 to 1).
 * @property {boolean} predicted_ECVM - Predicted Execution Constraint Viability Metric (true if viable).
 * @property {number} R_TH - The dynamically calculated Risk Threshold.
 * @property {boolean} Guaranteed_ADTM_Trigger - True if TEMM is predicted to fall below R_TH, guaranteeing activation of Atomic Drift Trajectory Mitigation (ADTM).
 */

// GATED EXECUTION PIPELINE (GSEP-C) Enhancement: Preemptive State Resolution (v94.2 Optimized Axiomatic Trajectory Mapping)
// Refactored to utilize asynchronous concurrency for R_TH calculation (Latency Mitigation) 
// and internal simulation (Computation Overlap), while implementing the TrajectoryMitigationAdvisor pattern.

class PreemptiveStateResolver {
    
    // -- SYNERGY REGISTRY DECLARATION --
    static SYNERGY_REQUIREMENTS = {
        SERVICES: {
            RiskThresholdCalculator: "RiskThresholdCalculatorService" 
        }
    };
    // ----------------------------------

    /** @type {Object} */
    #policyEngine;
    /** @type {Object} */
    #metricsStore;
    /** 
     * @type {{ projectTrajectory: function(Object, Object): { TEMM: number, ECVM: boolean } }} 
     * Simulation Engine interface (ACVD modeling).
     */
    #simEngine;
    
    /** @type {RiskAccessors} */
    #riskAccessors;
    /** @type {Object} */
    #riskModel;
    
    /** 
     * @type {{ execute: function({ TEMM: number, R_TH: number }): boolean }} 
     * Internal handler for the ADTM trigger logic, derived from TrajectoryMitigationAdvisor plugin.
     */
    mitigationAdvisor;

    /**
     * Initializes the Preemptive State Resolver, injecting core GAX components and required Kernel Synergy Services.
     * 
     * @param {Object} Dependencies - Structured dependencies required for PSR operation.
     * @param {Object} Dependencies.GAX_Context - Full context container.
     * @param {Object} Dependencies.SimulationEngine - Engine for TEMM/ECVM prediction.
     * @param {Object} Dependencies.KernelCapabilities - REQUIRED: The KERNEL_SYNERGY_CAPABILITIES subset relevant to PSR.
     * @throws {Error} If essential dependencies or required synergy interfaces are missing/malformed.
     */
    constructor({ GAX_Context, SimulationEngine, KernelCapabilities }) {
        if (!GAX_Context || !SimulationEngine) {
            throw new Error("[PSR Init] Missing essential dependencies: GAX_Context and SimulationEngine.");
        }
        
        // NOTE: We rely on SecurePluginExecutorUtility for centralized execution and validation,
        // so we no longer need to store the service instance or validate its 'execute' method here.
        
        const riskModel = GAX_Context.getRiskModel ? GAX_Context.getRiskModel() : null;
        
        const requiredContextProps = ['PolicyEngine', 'MetricsStore', 'getUFRM', 'getCFTM'];
        const missingContextProps = requiredContextProps.filter(prop => !GAX_Context[prop]);

        if (missingContextProps.length > 0 || !riskModel) {
             throw new Error(`[PSR Init] GAX_Context failed to provide necessary core components. Missing: ${missingContextProps.join(', ')} (RiskModel: ${!!riskModel ? 'Present' : 'Missing'}). This is a Kernel Context error.`);
        }

        this.#policyEngine = GAX_Context.PolicyEngine;
        this.#metricsStore = GAX_Context.MetricsStore;
        this.#simEngine = SimulationEngine;
        
        this.#riskAccessors = {
            getUFRM: GAX_Context.getUFRM,
            getCFTM: GAX_Context.getCFTM,
        };
        this.#riskModel = riskModel;
        
        // Initialize the internal Mitigation Advisor handler using the logic exported to the plugin
        this.mitigationAdvisor = { execute: ({ TEMM, R_TH }) => TEMM < R_TH }; 
    }

    /**
     * Private handler: Projects the policy constraints against the anticipated input manifest.
     * @param {Object} inputManifest - The workflow/transaction data to check.
     * @returns {boolean} True if initial policy projection passes the pre-vetted stage.
     */
    #projectPolicyViability(inputManifest) {
        try {
            const policyVolatility = this.#metricsStore.getPolicyVolatility();
            const policyViable = this.#policyEngine.checkViability(inputManifest, policyVolatility);
            return policyViable;
        } catch (error) {
            console.warn(`[PSR Policy Failure] Projection Error during checkViability. Treating as unviable: ${error.message}`);
            return false;
        }
    }

    /**
     * Initiates the asynchronous calculation of the Risk Threshold (R_TH) 
     * via the external Synergy Service, utilizing SecurePluginExecutorUtility 
     * for centralized execution and canonical error reporting.
     * 
     * @returns {Promise<number>} A Promise resolving to R_TH, or DEFAULT_SAFE_THRESHOLD on critical failure.
     */
    async #calculateRiskThresholdAsync() {
        const riskParams = {
            UFRM: this.#riskAccessors.getUFRM(),
            CFTM: this.#riskAccessors.getCFTM(),
            riskModel: this.#riskModel
        };
        
        const DEFAULT_SAFE_THRESHOLD = 0.0001;
        const SERVICE_ID = PreemptiveStateResolver.SYNERGY_REQUIREMENTS.SERVICES.RiskThresholdCalculator;

        try {
            // Use SecurePluginExecutorUtility for centralized, secure capability invocation
            const R_TH = await SecurePluginExecutorUtility.execute(
                SERVICE_ID, 
                'calculateThreshold', 
                riskParams
            );
            
            // Validate output integrity. Fail-secure mechanism requires dropping payload on transformation failure.
            if (typeof R_TH !== 'number' || R_TH < 0) {
                throw CanonicalErrorFactory.create(
                    'TELEMETRY_TRANSFORMATION_FAILURE', 
                    `R_TH calculation output from ${SERVICE_ID} was invalid or non-numeric.`, 
                    { receivedValue: R_TH }
                );
            }
            
            return R_TH;

        } catch (e) {
            // Adhere to high-integrity logging standards and fail-secure mechanism.
            const errorDetails = { 
                serviceId: SERVICE_ID, 
                method: 'calculateThreshold', 
                originalError: e.message 
            };
            
            // Log the failure using a canonical structure
            const canonicalError = CanonicalErrorFactory.create(
                'RISK_THRESHOLD_EXECUTION_FAILURE', 
                `Secure execution failed for R_TH calculation. Defaulting to safe minimal threshold (${DEFAULT_SAFE_THRESHOLD}).`,
                errorDetails
            );
            
            console.error(canonicalError.toString()); 
            
            return DEFAULT_SAFE_THRESHOLD;
        }
    }

    /**
     * Generates the Axiomatic Trajectory Map (ATM).
     * PERFORMANCE REFACTOR: Uses Promise concurrency to overlap external latency (R_TH) 
     * with local computation (Policy Check, Simulation).
     * 
     * @param {Object} inputManifest - The incoming workflow or transaction data.
     * @returns {Promise<ATMOutput>} ATM { predicted_TEMM, predicted_ECVM, R_TH, Guaranteed_ADTM_Trigger }
     */
    async generateATM(inputManifest) {
        if (!inputManifest) {
            throw new Error("[PSR] Input manifest required for ATM generation.");
        }
        
        // Stage 0a/0b: Initiate Risk Threshold Calculation (ASYNCHRONOUS START)
        const R_TH_Promise = this.#calculateRiskThresholdAsync();
        
        // Stage 1: Synchronous Policy Check (Runs concurrently with R_TH_Promise)
        const policyViable = this.#projectPolicyViability(inputManifest);

        if (!policyViable) {
            // Exit early on policy failure. Await R_TH for complete logging/output structure.
            const R_TH_Fail = await R_TH_Promise; 
            
            return {
                predicted_TEMM: 0,
                predicted_ECVM: false,
                R_TH: R_TH_Fail,
                Guaranteed_ADTM_Trigger: true 
            };
        }
        
        // Stage 2: Temporal & Constraint Prediction via Simulation (Runs concurrently with R_TH_Promise)
        const simulationResult = this.#simEngine.projectTrajectory(inputManifest, this.#policyEngine);
        
        const predicted_TEMM = simulationResult?.TEMM ?? 0; // Use nullish coalescing for safety
        const predicted_ECVM = simulationResult?.ECVM ?? false;

        // Stage 3: Await Risk Threshold Result
        const R_TH = await R_TH_Promise;
        
        // Stage 4: Final comparison using Mitigation Advisor pattern
        const Guaranteed_ADTM_Trigger = this.mitigationAdvisor.execute({ TEMM: predicted_TEMM, R_TH });
        
        return {
            predicted_TEMM,
            predicted_ECVM,
            R_TH,
            Guaranteed_ADTM_Trigger
        };
    }
}