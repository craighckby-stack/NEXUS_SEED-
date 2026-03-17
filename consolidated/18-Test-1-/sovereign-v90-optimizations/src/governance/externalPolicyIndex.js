/**
 * E-01: External Policy Index Kernel (EPIK)
 * Role: Provides a robust, read-only, synchronous interface to access verified, immutable external policies (compliance, mandates, kill-switches).
 * Mechanism: Manages periodic, cryptographically verified updates in the background to ensure high availability and minimal latency for Veto checks.
 * Adheres to AIA Enforcement Layer requirements for high-integrity governance data caching.
 */
class ExternalPolicyIndexKernel {
    // Defines the deterministic fail-safe policy applied on critical initialization failure.
    static FAILSAFE_POLICY = Object.freeze({ globalFreeze: true, rationale: "EPI Initialization Failure" });

    /** @type {Object} The critical synchronous state storage, guaranteed to be immutable. */
    #activePolicy = {}; 
    #lastFetchTime = 0;
    #isFetching = false;
    #isInitialized = false;
    #isInFailsafeMode = false;
    #policySourceTag = 'UNLOADED';

    /** @type {string} */
    #sourceUrl;
    /** @type {number} */
    #cacheDurationMs;

    /** @type {ILoggerToolKernel} */
    #logger;
    /** @type {ISecurePolicyLoaderToolKernel} */
    #policyLoader;
    /** @type {IBackgroundRefreshSchedulerToolKernel} */
    #scheduler;


    /**
     * @param {object} dependencies
     * @param {string} dependencies.sourceUrl - URL of the centralized governance feed (Configured via Registry).
     * @param {number} [dependencies.cacheDurationMs=3600000] - Duration in milliseconds for cache renewal (Configured via Registry).
     * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel - Standardized logging utility.
     * @param {ISecurePolicyLoaderToolKernel} dependencies.ISecurePolicyLoaderToolKernel - Secure fetch utility implementing cryptographic verification.
     * @param {IBackgroundRefreshSchedulerToolKernel} dependencies.IBackgroundRefreshSchedulerToolKernel - Kernel for managing periodic background tasks.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
        
        // Initialize state fields
        this.#activePolicy = {}; 
        this.#lastFetchTime = 0;
        this.#isFetching = false;
        this.#isInitialized = false;
        this.#isInFailsafeMode = false;
        this.#policySourceTag = 'UNLOADED';
    }

    /**
     * Internal method to rigorously validate and assign injected dependencies.
     * @param {object} dependencies
     */
    #setupDependencies(dependencies) {
        const { sourceUrl, cacheDurationMs = 3600000, ILoggerToolKernel, ISecurePolicyLoaderToolKernel, IBackgroundRefreshSchedulerToolKernel } = dependencies;

        if (!ISecurePolicyLoaderToolKernel || !ILoggerToolKernel || !IBackgroundRefreshSchedulerToolKernel || !sourceUrl) {
            throw new Error("GOV_E_004: ExternalPolicyIndexKernel requires sourceUrl, ILoggerToolKernel, ISecurePolicyLoaderToolKernel, and IBackgroundRefreshSchedulerToolKernel.");
        }
        
        this.#sourceUrl = sourceUrl;
        this.#cacheDurationMs = cacheDurationMs;
        this.#policyLoader = ISecurePolicyLoaderToolKernel;
        this.#logger = ILoggerToolKernel;
        this.#scheduler = IBackgroundRefreshSchedulerToolKernel;
    }

    /**
     * Stops the periodic cache refresh.
     * @returns {Promise<void>}
     */
    async stop() {
        if (this.#isInitialized) {
            await this.#scheduler.stop();
            this.#isInitialized = false;
            this.#logger.info('ExternalPolicyIndexKernel refresh mechanism stopped.', { conceptId: 'GOV_INFO_005' });
        }
    }

    /**
     * Starts the initial fetch and sets up the background periodic cache refresh.
     * This operation must be asynchronous.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.#isInitialized) return;
        
        // Immediate initial load (critical step 1: must succeed or fall back to fail-safe)
        await this.#fetchAndSetPolicies(true);
        
        if (this.#isInFailsafeMode) {
             this.#logger.critical("ExternalPolicyIndexKernel Initialized in FAILSAFE Mode. Governance functionality is suspended.", { conceptId: 'GOV_CRIT_001' });
        } else if (Object.keys(this.#activePolicy).length === 0) {
            this.#logger.warning("Initialization warning: Policy state remains empty after load attempt.", { conceptId: 'GOV_WARN_001' });
        }
        
        // Set up the periodic background refresh task using the injected Scheduler tool
        await this.#scheduler.start({
            taskFunction: () => this.#fetchAndSetPolicies(false), 
            intervalMs: this.#cacheDurationMs,
            taskName: 'EPIK_Refresh'
        });

        this.#isInitialized = true;
        this.#logger.info(`ExternalPolicyIndexKernel initialized (Tag: ${this.#policySourceTag}).` + 
                         (this.#isInFailsafeMode ? ' (Failsafe Enabled)' : ''), { conceptId: 'GOV_INFO_006' });
    }

    /**
     * Attempts to fetch policies securely, applying concurrency control.
     * @param {boolean} initialLoad - If true, treats failures as critical system threats leading to failsafe.
     * @returns {Promise<boolean>} True if policy cache was updated, False otherwise.
     */
    async #fetchAndSetPolicies(initialLoad = false) {
        if (this.#isFetching) {
            if (!initialLoad) {
                this.#logger.debug("Skipped refresh attempt: Previous fetch is still in progress.", { conceptId: 'GOV_DEBUG_001' });
            }
            return false;
        }

        this.#isFetching = true;
        const fetchStartTime = Date.now();
        
        try {
            // Use the injected secure loader, which handles cryptographic verification.
            const fetchedData = await this.#policyLoader.load(this.#sourceUrl);
            
            // Validate data integrity before committing to state
            if (!fetchedData || !fetchedData.mandates) {
                // Ensure structured error path for auditability
                throw new Error("GOV_E_005: Invalid or empty policy structure received after verification.");
            }

            // Atomically update the synchronous state
            this.#activePolicy = this.#parseMandates(fetchedData.mandates);
            this.#lastFetchTime = fetchStartTime;
            this.#policySourceTag = fetchedData.tag || `V${fetchStartTime}`; 
            this.#isInFailsafeMode = false; 

            this.#logger.info(`Policy state updated successfully. Tag: ${this.#policySourceTag}.`, { conceptId: 'GOV_INFO_007', tag: this.#policySourceTag });
            return true;
        } catch (error) {
            this.#logger.error(`Error during policy fetch: ${error.message}`, { conceptId: 'GOV_E_006', errorDetails: error });

            if (initialLoad) {
                // Initial Load Failure: Must enforce failsafe policy immediately.
                this.#logger.critical("CRITICAL FAILURE: Cannot load initial policies. Enforcing deterministic failsafe freeze.", { conceptId: 'GOV_CRIT_002' });
                this.#activePolicy = ExternalPolicyIndexKernel.FAILSAFE_POLICY; 
                this.#policySourceTag = 'FAILSAFE_INIT';
                this.#isInFailsafeMode = true;
            } else {
                 this.#logger.warning(`Background policy fetch failed. Relying on existing state (Tag: ${this.#policySourceTag}, Last fetched: ${new Date(this.#lastFetchTime).toISOString()}).`, { conceptId: 'GOV_WARN_002', tag: this.#policySourceTag });
            }
            return false;
        } finally {
            this.#isFetching = false;
        }
    }

    /**
     * Enforces strong immutability and extracts required fields from the verified mandates.
     */
    #parseMandates(mandates) {
        return Object.freeze({
            // L1: Global Controls
            globalFreeze: Boolean(mandates.globalFreeze),
            // L2: Targeted Controls
            restrictedAreas: Array.isArray(mandates.restrictedAreas) ? mandates.restrictedAreas.map(a => String(a).toLowerCase()) : [],
            // Internal audit marker
            _timestamp: Date.now()
        });
    }

    /**
     * @param {Object} proposalMetadata - Metadata describing the proposed change (e.g., area of modification, targetArea).
     * @returns {boolean} True if a mandatory external veto applies. CRITICAL: This MUST be synchronous and fast.
     */
    isVetoRequired(proposalMetadata) {
        // If queried before successful initialization or while in critical failsafe mode.
        if (!this.#isInitialized || this.#isInFailsafeMode) {
            if (this.#isInFailsafeMode) {
                 this.#logger.warning("ExternalPolicyIndexKernel queried while in CRITICAL FAILSAFE MODE. Veto enforced.", { conceptId: 'GOV_WARN_003' });
                 return true; // Failsafe policy is defined as globalFreeze: true
            }
            // If not initialized, enforce veto for safety.
            this.#logger.error("ExternalPolicyIndexKernel queried before initialization completion. Veto enforced.", { conceptId: 'GOV_E_007' });
            return true;
        }

        // Rule 1: Global Freeze
        if (this.#activePolicy.globalFreeze) {
            return true;
        }

        // Rule 2: Restricted Area Check
        const targetArea = (proposalMetadata && proposalMetadata.targetArea) ? String(proposalMetadata.targetArea).toLowerCase() : null;
        if (targetArea && this.#activePolicy.restrictedAreas.includes(targetArea)) {
            this.#logger.debug(`Veto triggered: Target area '${targetArea}' is restricted by external policy (Tag: ${this.#policySourceTag}).`, { conceptId: 'GOV_DEBUG_002', targetArea });
            return true;
        }
        
        return false;
    }

    /**
     * Provides the current state tag for auditing purposes.
     * @returns {string}
     */
    getPolicyTag() {
        return this.#policySourceTag;
    }

    /**
     * Provides access to the currently active, immutable policy for detailed checks (use sparingly).
     * @returns {Object}
     */
    getActivePolicy() {
        return this.#activePolicy;
    }
}