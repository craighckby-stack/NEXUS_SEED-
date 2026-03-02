/**
 * Component ID: RTM
 * Name: Runtime Threshold Manager
 * Function: Manages persistent storage, validation, and real-time distribution of the system's
 *           governance parameters (weights, thresholds, severity boosts) used by RCE (C-11) and other control loops.
 * Rationale: Ensures that constraint evaluation is driven by a single, dynamically configurable source of truth,
 *            decoupling constraint values from application code defaults.
 */

const DEFAULT_CONFIG_PATH = '/etc/agi/governance/constraints.json';

class RuntimeThresholdManager {
    /**
     * @param {Object} persistenceService Service for configuration storage (e.g., File system, Database).
     */
    constructor(persistenceService) {
        this.persistenceService = persistenceService;
        this.currentConstraints = {};
        this.isLoaded = false;
    }

    /**
     * Loads constraints from the persistent layer and validates them against the schema.
     * @async
     */
    async loadConfiguration() {
        try {
            // In a real system, schema validation would occur here.
            const rawConfig = await this.persistenceService.read(DEFAULT_CONFIG_PATH);
            this.currentConstraints = JSON.parse(rawConfig);
            this.isLoaded = true;
            console.log("[RTM] Constraints loaded successfully.");
        } catch (error) {
            console.error("[RTM] Failed to load constraint configuration. Falling back to internal defaults.", error);
            // If loading fails, RCE uses its hardcoded defaults, but RTM must still provide an interface.
            this.currentConstraints = {}; 
            this.isLoaded = false;
        }
    }

    /**
     * Retrieves the current, validated governance constraints.
     * @returns {Object} The complete configuration object for RCE consumption.
     */
    getConstraints() {
        // Returns the loaded configuration; RCE handles merging this with its hardcoded defaults.
        return this.currentConstraints;
    }

    /**
     * Updates a single constraint parameter (requires authorization and validation in production).
     * @async
     * @param {string} metricKey
     * @param {Object} newParams { threshold, weight, severity_boost }
     */
    async updateConstraint(metricKey, newParams) {
        if (!this.currentConstraints[metricKey]) {
            throw new Error(`Metric key ${metricKey} not found for update.`);
        }
        
        this.currentConstraints[metricKey] = { ...this.currentConstraints[metricKey], ...newParams };
        // In production, this would also trigger a save/persistence update.
        console.log(`[RTM] Constraint updated for ${metricKey}. Persistence update required.`);
        // Potential future feature: Emit an event for hot-reloading configurations in active RCE instances.
    }
}

module.exports = RuntimeThresholdManager;