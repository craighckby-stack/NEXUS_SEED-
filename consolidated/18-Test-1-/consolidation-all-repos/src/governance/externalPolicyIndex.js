/**
 * E-01: External Policy Index (EPI)
 * Role: Provides a robust, read-only, synchronous interface to access verified, immutable external policies (compliance, mandates, kill-switches).
 * Mechanism: Manages periodic, cryptographically verified updates in the background to ensure high availability and minimal latency for Veto checks.
 */
class ExternalPolicyIndex {
    // Defines the deterministic fail-safe policy applied on critical initialization failure.
    static FAILSAFE_POLICY = Object.freeze({ globalFreeze: true, rationale: "EPI Initialization Failure" });

    /**
     * @param {Object} config
     * @param {string} config.sourceUrl - URL of the centralized governance feed.
     * @param {number} [config.cacheDurationMs=3600000] - Duration in milliseconds for cache renewal.
     * @param {Object} config.PolicyFetcher - Dependency Injection for the secure fetch utility (must handle verification).
     * @param {Object} config.logger - Standardized logging utility.
     */
    constructor({ sourceUrl, cacheDurationMs = 3600000, PolicyFetcher, logger }) {
        if (!PolicyFetcher || typeof PolicyFetcher.fetch !== 'function' || !sourceUrl || !logger || typeof logger.info !== 'function') {
            throw new Error("E-01: EPI must be initialized with sourceUrl, reliable PolicyFetcher, and a compliant logger.");
        }
        
        this.sourceUrl = sourceUrl;
        this.cacheDurationMs = cacheDurationMs;
        this.fetcher = PolicyFetcher;
        this.logger = logger;

        this.policyCache = {}; // The critical synchronous state storage
        this.lastFetchTime = 0;
        this.refreshIntervalHandle = null;
        
        // Concurrency Control: Ensures only one update process runs at a time.
        this.isFetching = false;
        this.isInitialized = false;
        this.policySourceTag = 'UNLOADED'; // Track version/tag of the policies loaded
    }

    /**
     * Stops the periodic cache refresh.
     */
    stop() {
        if (this.refreshIntervalHandle) {
            clearInterval(this.refreshIntervalHandle);
            this.refreshIntervalHandle = null;
            this.isInitialized = false;
            this.logger.info('E-01 Index refresh interval stopped.');
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
        
        if (!this.policyCache || Object.keys(this.policyCache).length === 0) {
            this.logger.error("E-01 Initialization warning: Policy cache remains empty after initial load attempt (excluding deterministic failsafe).");
        }
        
        // Set up the periodic background refresh task (critical step 2)
        this.refreshIntervalHandle = setInterval(() => {
            this._fetchAndSetPolicies(false);
        }, this.cacheDurationMs);

        this.isInitialized = true;
        this.logger.info(`E-01 Index initialized (Tag: ${this.policySourceTag}). Background refresh set for every ${this.cacheDurationMs / 1000}s.`);
    }

    /**
     * Attempts to fetch policies securely, applying concurrency control.
     * @param {boolean} initialLoad - If true, treats failures as critical system threats leading to failsafe.
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
            
            // Validate data integrity before committing to cache
            if (!fetchedData || !fetchedData.mandates) {
                throw new Error("Invalid or empty policy structure received after verification.");
            }

            // Atomically update the synchronous state
            this.policyCache = this._parseMandates(fetchedData.mandates);
            this.lastFetchTime = fetchStartTime;
            this.policySourceTag = fetchedData.tag || `V${fetchStartTime}`; // Use fetched tag or generate fallback version tag
            
            this.logger.info(`E-01 Cache updated successfully. Tag: ${this.policySourceTag}.`);
            return true;
        } catch (error) {
            if (initialLoad) {
                // Initial Load Failure: Must enforce failsafe policy immediately.
                this.logger.critical("E-01 CRITICAL FAILURE: Cannot load initial policies. Enforcing deterministic failsafe freeze.", { error: error.message });
                this.policyCache = ExternalPolicyIndex.FAILSAFE_POLICY; 
                this.policySourceTag = 'FAILSAFE_INIT';
            } else {
                 this.logger.warn(`E-01: Background policy fetch failed. Relying on existing cache (Tag: ${this.policySourceTag}, Last fetched: ${new Date(this.lastFetchTime).toISOString()}).`, { error: error.message });
            }
            return false;
        } finally {
            this.isFetching = false;
        }
    }

    _parseMandates(mandates) {
        // Enforce strong immutability and consistency on the policy object.
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
        if (!this.isInitialized) {
            // Fail-safe trigger: If queried before the system confirms readiness (post-initialization lock).
            this.logger.warning("E-01 queried before initialization completed. Veto enforced (Fail-Safe Mode).");
            return true; 
        }

        const policy = this.policyCache;
        
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