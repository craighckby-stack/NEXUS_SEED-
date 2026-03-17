/**
 * Component ID: SCR
 * System Configuration Registry (SCR) v94.1
 *
 * Responsibility: Centralized, versioned registry for system-wide constants, thresholds, and learned weights.
 * Enforces strict immutability on retrieved configurations and prepares structure for governance and nesting.
 */

// Simple deep clone utility for reliable configuration delivery
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// --- Extracted Plugin Integration Simulation ---
// Simulating access to the ObjectPathResolver tool (OPR).
const ObjectPathResolverTool = {
    get: (obj, path) => {
        if (!obj || !path) return undefined;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    },
    set: (obj, path, value) => {
        if (!obj || !path) return false;
        const parts = path.split('.');
        let current = obj;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
                current[part] = {};
            }
            current = current[part];
        }

        current[parts[parts.length - 1]] = value;
        return true;
    }
};
// -----------------------------------------------

class SystemConfigurationRegistry {
    constructor() {
        // Base configuration is immutable, defining system defaults and structural hierarchy.
        this._config = Object.freeze({
            // Governance requirements configuration
            GOVERNANCE_CONFIG: Object.freeze({
                ACCESS_LEVEL_MINIMUM: 'C-13', 
                MAX_CHANGE_DEVIATION: 0.15,
            }),

            // Systemic Entropy Auditor (SEA) Tunables
            'SEA': {
                WEIGHTS: {
                    COUPLING_FACTOR: 0.45,
                    COMPLEXITY_STRAIN: 0.30,
                    GOVERNANCE_OVERHEAD: 0.25
                },
                THRESHOLDS: {
                    WARNING: 0.60,
                    CRITICAL: 0.85
                }
            },

            // Foundation Building Agent (FBA) configuration example
            'FBA': {
                RECURSION_LIMIT: 5,
                ADAPTIVE_RATE: 0.01
            }
        });
        
        // This object holds mutable, dynamically learned overrides applied by Adaptive Learning Models.
        this._overrides = {};
    }

    /**
     * Retrieves a configuration setting. Supports dot notation (e.g., 'SEA.WEIGHTS.COUPLING_FACTOR').
     * Returns a deep clone (read-only reference) to protect internal state.
     * @param {string} key Configuration path
     */
    get(key) {
        // Prioritize overrides using the ObjectPathResolverTool
        let value = ObjectPathResolverTool.get(this._overrides, key);

        if (value === undefined) {
             // Fallback to base configuration using the ObjectPathResolverTool
             value = ObjectPathResolverTool.get(this._config, key);
        }

        if (value === undefined) {
             console.warn(`[SCR] Configuration key not found: ${key}`);
             return null;
        }
        
        // Return immutable deep clone
        return deepClone(value);
    }

    /**
     * Used by Adaptive Learning Modules to update system parameters (creates an override).
     * Must pass validation by Configuration Governance Policy (CGP).
     * @param {string} path Configuration path (e.g., 'SEA.WEIGHTS.COUPLING_FACTOR')
     * @param {*} value New configuration value.
     * @param {Object} accessContext Context providing governance authentication details (e.g., {componentId: 'C-13'}).
     */
    set(path, value, accessContext = {}) {
        // HOOK: Governance Validation must occur here (e.g., ConfigurationGovernancePolicy.validateChange(path, value, accessContext))
        
        // Check existence using the ObjectPathResolverTool
        if (ObjectPathResolverTool.get(this._config, path) === undefined && ObjectPathResolverTool.get(this._overrides, path) === undefined) {
            console.error(`[SCR] Attempted to set path that does not exist or has no defined default: ${path}`);
            return false;
        }

        // Use ObjectPathResolverTool.set to handle nested mutation and creation of intermediate objects
        // NOTE: Must trigger centralized system logging here (SCR_CHANGE, path, oldValue, newValue, timestamp)
        return ObjectPathResolverTool.set(this._overrides, path, value);
    }
    
    getCurrentConfiguration() {
        return deepClone(Object.assign({}, this._config, this._overrides));
    }
}

module.exports = SystemConfigurationRegistry;