const { deepMerge } = require('../utility/DeepMerge');

/**
 * Applies environment-specific configuration overrides defined within the configuration manifesto.
 * This utility is critical for resolving layered configuration profiles efficiently.
 * @param {object} config - The base configuration object.
 * @param {string} environment - The environment key (e.g., 'staging', 'production').
 * @returns {object} The resolved configuration.
 */
const applyEnvironmentOverrides = (config, environment) => {
    if (!config || !config.environment_overrides || !environment) return config;

    const overrideSet = config.environment_overrides[environment];
    if (!overrideSet) return config;

    // Create a mutable, deep copy of the base configuration before applying overrides
    const workingConfig = JSON.parse(JSON.stringify(config));
    
    // Apply the overrides recursively onto the base configuration structure using the dedicated utility
    deepMerge(workingConfig, overrideSet);

    // Remove the manifest metadata from the resolved runtime config to finalize
    delete workingConfig.environment_overrides;
    return workingConfig;
};

// UNIFIER Protocol: Export core function
module.exports = { applyEnvironmentOverrides };
