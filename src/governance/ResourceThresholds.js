// src/governance/ResourceThresholds.js

/**
 * RESOURCE THRESHOLDS CONFIGURATION (RTC)
 * ID: RTC-G02
 * GSEP Role: Provides a centralized, typed interface for accessing
 * versioned resource governance thresholds and baselines.
 *
 * Decouples static numerical thresholds from the dynamic check logic
 * within the ResourceCheckRegistry (RCR).
 */

const V1_THRESHOLDS = Object.freeze({
    // Core Operational Baselines
    CPU_CORE_BASELINE: 0.85, // Max utilization before triggering FAIL
    MEMORY_RESERVE_MIN_MB: 256, // Minimum required MB reserve
    LATENCY_MAX_MS: 50, // Maximum allowed execution latency for critical operations

    // Mutation Specific Overheads
    MUTATION_HEAP_MAX_MB: 1024,
    MUTATION_TIMEOUT_S: 120,
});

class ResourceThresholds {
    /**
     * @param {string} [version='V1'] - The governance threshold version to enforce.
     */
    constructor(version = 'V1') {
        this.version = version;
        this.config = this._loadVersion(version);
    }

    /**
     * Loads the specific threshold configuration version.
     * @private
     * @param {string} version 
     * @returns {Object}
     */
    _loadVersion(version) {
        switch (version.toUpperCase()) {
            case 'V1':
                return V1_THRESHOLDS;
            default:
                console.warn(`RTC Warning: Unknown threshold version '${version}'. Falling back to V1.`);
                return V1_THRESHOLDS;
        }
    }

    /**
     * Retrieves a specific threshold value.
     * Enforces strict key validation.
     * @param {string} key - The threshold identifier (e.g., 'CPU_CORE_BASELINE').
     * @returns {number | undefined} The numerical threshold value.
     */
    get(key) {
        const value = this.config[key];
        if (typeof value === 'undefined') {
             // Explicit failure for missing required keys improves RCR reliability.
             throw new Error(`RTC Error: Required threshold '${key}' not defined in version ${this.version}.`);
        }
        return value;
    }

    /**
     * Reloads thresholds, potentially allowing for dynamic runtime reconfiguration.
     * @param {string} version 
     */
    reload(version) {
        this.version = version;
        this.config = this._loadVersion(version);
    }
}

module.exports = ResourceThresholds;