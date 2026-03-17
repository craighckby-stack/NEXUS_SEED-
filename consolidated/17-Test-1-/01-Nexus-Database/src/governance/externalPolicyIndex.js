/**
 * E-01: External Policy Index (EPI)
 * Role: Provides a robust, read-only, synchronous interface to access verified, immutable external policies (compliance, mandates, kill-switches).
 * Mechanism: Manages periodic, cryptographically verified updates in the background to ensure high availability and minimal latency for Veto checks.
 * 
 * Refactoring Rationale (v94.1):
 * 1. Reliability: Replaced setInterval with self-scheduling setTimeout for the refresh cycle. This ensures that the cache renewal interval begins only *after* the previous fetch and processing cycle has completed, preventing queue buildup if latency spikes.
 * 2. Clarity: Renamed 'policyCache' to 'activePolicy' to better reflect its role as the critical, synchronous state required for veto checks.
 * 3. State Management: Introduced 'isInFailsafeMode' to explicitly track the system state following a critical initial loading failure, aiding diagnostics.
 */
class ExternalPolicyIndex {
    // Defines the deterministic fail-safe policy applied on critical initialization failure.
    static FAILSAFE_POLICY = Object.freeze({ globalFreeze: true, rationale: "EPI Initialization Failure" });

    /**
     * @param {Object} config
     * @param {string} config.sourceUrl - URL of the centralized governance feed.
     * @param {number} [config.cacheDurationMs=3600000] - Duration in milliseconds for cache renewal.
     * @param {Object} config.PolicyFetcher - Dependency Injection for the secure fetch utility (must implement IPolicyFetcher and handle verification).
     * @param {Object} config.logger - Standardized logging utility.
     */
    constructor({ sourceUrl, cacheDurationMs = 3600000, PolicyFetcher, logger }) {
        if (!PolicyFetcher || typeof PolicyFetcher.fetch !== 'function' || !sourceUrl || !logger || typeof logger.info !== 'function') {
            throw new Error("E-01: EPI must be initialized with sourceUrl, reliable PolicyFetcher (implementing fetch), and a compliant logger.");
        }
        
        this.sourceUrl = sourceUrl;
        this.cacheDurationMs = cacheDurationMs;
        this.fetcher = PolicyFetcher;
        this.logger = logger;

        this.activePolicy = {}; // The critical synchronous state storage
        this.lastFetchTime = 0;
        this.refreshTimeoutHandle = null; // Changed from interval to timeout handle
        
        // Concurrency Control: Ensures only one update process runs at a time.
        this.isFetching = false;
        this.isInitialized = false;
        this.isInFailsafeMode = false; // New state flag
        this.policySourceTag = 'UNLOADED'; // Track version/tag of the policies loaded
    }

    /**
     * Clears the refresh timeout handle.
     */
    _clearRefreshHandle() {
        if (this.refreshTimeoutHandle) {
            clearTimeout(this.refreshTimeoutHandle);
            this.refreshTimeoutHandle = null;
        }
    }

    /**
     * Schedules the next policy refresh using setTimeout (self-scheduling logic).
     */
    _scheduleNextRefresh() {
        this._clearRefreshHandle();
        
        this.refreshTimeoutHandle = setTimeout(() => {
            // Use .then() to schedule the next run regardless of the outcome of the fetch attempt
            this._fetchAndSetPolicies(false)
                .finally(() => {
                    // Only reschedule if the system is still expected to be active
                    if (this.isInitialized) {
                        this._scheduleNextRefresh();
                    }
                });
        }, this.cacheDurationMs);
        
        this.logger.debug(`E-01 Next refresh scheduled in ${this.cacheDurationMs / 1000}s.`);
    }

    /**
     * Stops the periodic cache refresh.
     */
    stop() {
        if (this.isInitialized) {
            this._clearRefreshHandle();
            this.isInitialized = false;
            this.logger.info('E-01 Index refresh mechanism stopped.');
        }
    }

    /**
     * Starts the initial fetch and sets up the background periodic cache refresh.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;
        
        // Immediate initial load (critical step 1: must succeed or fall back to fail-safe)
        await this._fetchAndSetPolicies(true);
        
        if (this.isInFailsafeMode) {
             this.logger.critical("E-01 Initialized in FAILSAFE Mode. Governance functionality is suspended.");
        } else if (Object.keys(this.activePolicy).length === 0) {
            this.logger.error("E-01 Initialization warning: Policy state remains empty after load attempt.");
        }
        
        // Set up the periodic background refresh task (critical step 2) using self-scheduling
        this._scheduleNextRefresh();

        this.isInitialized = true;
        this.logger.info(`E-01 Index initialized (Tag: ${this.policySourceTag}).` + 
                         (this.isInFailsafeMode ? ' (Failsafe Enabled)' : ''));
    }

    /**
     * Attempts to fetch policies securely, applying concurrency control.
     * @param {boolean} initialLoad - If true, treats failures as critical system threats leading to failsafe.
     * @returns {Promise<boolean>} True if policy cache was updated, False otherwise.
     */
    async _fetchAndSetPolicies(initialLoad = false) {
        if (this.isFetching) {
            if (!initialLoad) {
                this.logger.debug("E-01 Skipped refresh attempt: Previous fetch is still in progress.");
            }
            return false;
        }

        this.isFetching = true;
        const fetchStartTime = Date.now();
        
        try {
            // Assumes PolicyFetcher handles cryptographic verification and returns structured mandates, including a 'tag'.
            const fetchedData = await this.fetcher.fetch(this.sourceUrl);
            
            // Validate data integrity before committing to state
            if (!fetchedData || !fetchedData.mandates) {
                throw new Error("Invalid or empty policy structure received after verification.");
            }

            // Atomically update the synchronous state
            this.activePolicy = this._parseMandates(fetchedData.mandates);
            this.lastFetchTime = fetchStartTime;
            this.policySourceTag = fetchedData.tag || `V${fetchStartTime}`; // Use fetched tag or generate fallback version tag
            this.isInFailsafeMode = false; // Successfully updated, exit failsafe state if previously active.

            this.logger.info(`E-01 Policy state updated successfully. Tag: ${this.policySourceTag}.`);
            return true;
        } catch (error) {
            if (initialLoad) {
                // Initial Load Failure: Must enforce failsafe policy immediately.
                this.logger.critical("E-01 CRITICAL FAILURE: Cannot load initial policies. Enforcing deterministic failsafe freeze.", { error: error.message });
                this.activePolicy = ExternalPolicyIndex.FAILSAFE_POLICY; 
                this.policySourceTag = 'FAILSAFE_INIT';
                this.isInFailsafeMode = true;
            } else {
                 this.logger.warn(`E-01: Background policy fetch failed. Relying on existing state (Tag: ${this.policySourceTag}, Last fetched: ${new Date(this.lastFetchTime).toISOString()}).`, { error: error.message });
            }
            return false;
        } finally {
            this.isFetching = false;
        }
    }

    /**
     * Enforces strong immutability and extracts required fields from the verified mandates.
     */
    _parseMandates(mandates) {
        return Object.freeze({
            // L1: Global Controls
            globalFreeze: Boolean(mandates.globalFreeze),
            // L2: Targeted Controls (e.g., area restriction list)
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
        if (!this.isInitialized || this.isInFailsafeMode) {
            // Fail-safe trigger: If queried before the system confirms readiness (post-initialization lock).
            // Note: If initial load succeeded but subsequent background fetches fail, we still rely on the stale, valid 'activePolicy', not this global freeze.
            if (this.isInFailsafeMode) {
                 this.logger.warning("E-01 queried while in CRITICAL FAILSAFE MODE. Veto enforced.");
                 return true;
            }
            // This path should ideally not be hit if initialize() finishes its blocking call before this component is used.
            this.logger.warning("E-01 queried before initialization completed. Enforcing veto to prevent unauthorized operation.");
            return true; 
        }

        const policy = this.activePolicy;
        
        // L1: Global Mandates (Highest Precedence)
        if (policy.globalFreeze === true) {
            this.logger.debug("Veto triggered by L1: Global Freeze mandate.");
            return true; 
        }
        
        // L2: Targeted Restrictions
        const targetArea = (proposalMetadata.targetArea || 'unknown').toLowerCase();
        if (policy.restrictedAreas.includes(targetArea)) {
            this.logger.debug(`Veto triggered by L2: Target area '${targetArea}' is restricted.`);
            return true;
        }
        
        return false;
    }
}

module.exports = ExternalPolicyIndex;