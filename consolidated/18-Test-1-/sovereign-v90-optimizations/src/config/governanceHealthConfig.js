class GovernanceHealthConfigRegistryKernel {
    #config;

    /**
     * @typedef {object} ComponentHealthConfig
     * @property {number} weight - Weight assigned to this component (higher means greater impact on overall GRS).
     * @property {number} latencyThresholdMs - Maximum acceptable latency in milliseconds for this component.
     */

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Helper function to recursively freeze an object.
     * @param {object} obj
     * @private
     */
    #deepFreeze(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;

        Object.keys(obj).forEach(prop => {
            const value = obj[prop];
            if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
                this.#deepFreeze(value);
            }
        });
        return Object.freeze(obj);
    }

    /**
     * Synchronously sets up internal configuration constants and ensures immutability.
     * This strictly isolates synchronous constant definition and initialization.
     * @private
     */
    #setupDependencies() {
        const RAW_GOVERNANCE_HEALTH_CONFIG = {
            // === Global Monitoring Thresholds ===
            globalLatencyThresholdMs: 450,
            minimumGRSThreshold: 0.88,

            // === Component-Specific Overrides and Weights ===
            components: {
                mcraEngine: {
                    weight: 3.0,
                    latencyThresholdMs: 250
                },
                atmSystem: {
                    weight: 2.0,
                    latencyThresholdMs: 500
                },
                policyEngine: {
                    weight: 1.5,
                    latencyThresholdMs: 600
                },
                auditLogger: {
                    weight: 0.5,
                    latencyThresholdMs: 1000
                }
            }
        };

        // Ensure the configuration structure is immutable
        this.#config = this.#deepFreeze(RAW_GOVERNANCE_HEALTH_CONFIG);
    }

    /**
     * Retrieves the complete Governance Health Configuration.
     * @returns {Readonly<object>} The immutable configuration object.
     */
    getGovernanceHealthConfig() {
        return this.#config;
    }

    /**
     * Retrieves the global latency threshold in milliseconds.
     * @returns {number}
     */
    getGlobalLatencyThresholdMs() {
        return this.#config.globalLatencyThresholdMs;
    }

    /**
     * Retrieves the minimum required Governance Readiness Signal (GRS) threshold.
     * @returns {number}
     */
    getMinimumGRSThreshold() {
        return this.#config.minimumGRSThreshold;
    }

    /**
     * Retrieves the component-specific health configurations.
     * @returns {Readonly<Object.<string, ComponentHealthConfig>>}
     */
    getComponentConfigurations() {
        return this.#config.components;
    }

    /**
     * Retrieves the configuration for a specific component.
     * @param {string} componentName
     * @returns {Readonly<ComponentHealthConfig> | undefined}
     */
    getComponentConfig(componentName) {
        return this.#config.components[componentName];
    }
}

module.exports = GovernanceHealthConfigRegistryKernel;