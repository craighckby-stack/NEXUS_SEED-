// src/governance/AdaptiveConstantManager.js

// --- Utility Functions for Robust Configuration Management ---
const isObject = (item) => {
    return (item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * Recursively merges source into target, crucial for updating nested configurations
 * without overwriting entire policy blocks.
 */
const deepMerge = (target, source) => {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                // Ensure target has the key or initialize it
                if (!(key in target) || typeof target[key] === 'undefined') {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    return output;
};
// -----------------------------------------------------------

// Manages and merges static governance constants with dynamic, runtime-adjusted overlays.
// This service ensures that system constants can be tuned by external or self-tuning agents
// based on real-time performance data, providing maximum operational efficiency without restarts.

const STATIC_CONSTANTS = require('../../config/governance_constants_v2.json');

class AdaptiveConstantManager {
    constructor() {
        // Initialize config with a deep copy of static constants
        this.currentConfig = deepMerge({}, STATIC_CONSTANTS);
        this.fetchIntervalId = null; 

        const overlaySource = this.getConstant('dynamic_overlay_source');
        
        if (overlaySource && overlaySource.enabled) {
            this.startDynamicFetch(overlaySource);
        }
    }

    startDynamicFetch(source) {
        const fallbackInterval = this.getConstant('governance_intervals.telemetry_reporting_ms') || 15000; // Default 15s
        const interval = source.polling_interval_ms || fallbackInterval;

        if (!source.fetch_endpoint) {
            console.warn('Dynamic constant fetching disabled: missing fetch_endpoint in dynamic_overlay_source.');
            return;
        }

        const fetchConstants = async () => {
            try {
                // NOTE: A dedicated network adapter (like the proposed GovernanceApiAdapter) should handle this complexity.
                // Placeholder implementation for fetching new runtime configuration:
                // const response = await fetch(source.fetch_endpoint);
                // const newConfig = await response.json();

                // Placeholder simulation:
                const newConfig = { 
                    system_tuning: { last_check: Date.now() },
                    execution_policy: { max_recursion_depth: 60 } 
                };

                this.mergeConfig(newConfig);
            } catch (error) {
                console.error('Failed to fetch dynamic governance constants:', error.message);
                // TODO: Implement advanced backoff or circuit breaking logic here.
            }
        };

        // Execute immediately upon starting the manager, then set the interval.
        fetchConstants(); 
        
        this.fetchIntervalId = setInterval(fetchConstants, interval);
        console.log(`Dynamic constant fetching started. Polling URL: ${source.fetch_endpoint}. Interval: ${interval}ms.`);
    }

    mergeConfig(overlay) {
        // Use dedicated deepMerge utility for robust, nested configuration updates.
        const prevConfigJson = JSON.stringify(this.currentConfig); // Snapshot for comparison
        this.currentConfig = deepMerge(this.currentConfig, overlay);
        
        if (prevConfigJson !== JSON.stringify(this.currentConfig)) {
            console.log('[ACL] Governance constants updated dynamically. Configuration delta applied.');
        }
    }

    getConstant(path) {
        // Utility to retrieve a nested constant safely, returning undefined on failure.
        if (!path || typeof path !== 'string') return undefined;

        try {
            return path.split('.').reduce((o, i) => {
                // Ensure object exists before accessing property
                if (!o || typeof o !== 'object') return undefined;
                return o[i];
            }, this.currentConfig);
        } catch (e) {
            console.error(`Error during constant retrieval for path: ${path}`, e.message);
            return undefined;
        }
    }

    stop() {
        if (this.fetchIntervalId) {
            clearInterval(this.fetchIntervalId);
            this.fetchIntervalId = null;
            console.log('AdaptiveConstantManager polling stopped.');
        }
    }
}

// Export a robust singleton instance
module.exports = new AdaptiveConstantManager();