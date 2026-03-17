/**
 * Ensures strict and predictable access to critical telecom configuration standards
 * resolved via the KERNEL configuration system.
 *
 * This module translates runtime configuration keys into stable, exported constants.
 */

/**
 * Validates and retrieves the required configuration access plugin dependency.
 * This encapsulates synchronous dependency lookup and validation.
 * @returns {Object} The ConfigurationAccessPlugin instance.
 * @private
 */
const _getValidatedConfigLoader = () => {
    try {
        // Resolve the plugin once upon module initialization
        const { ConfigurationAccessPlugin } = KERNEL_SYNERGY_CAPABILITIES.Plugin.get("ConfigurationAccessPlugin");
        if (!ConfigurationAccessPlugin || typeof ConfigurationAccessPlugin.loadConfig !== 'function') {
            throw new Error("Interface violation: 'loadConfig' method missing.");
        }
        return ConfigurationAccessPlugin;
    } catch (error) {
        // Centralized failure handling for critical dependencies
        throw new Error(`[TelecomStandards] Critical dependency failure during initialization: ${error.message}`);
    }
};


// 1. Dependency Resolution and Encapsulation
const CONFIG_LOADER = _getValidatedConfigLoader();

// 2. Load the configuration object once
const telecommConfig = CONFIG_LOADER.loadConfig("TelecommConfig");

// 3. Extract and export standardized constants from the loaded configuration

/**
 * Standard segment limit (in characters) for a single GSM 7-bit encoded SMS message.
 */
export const GSM_7BIT_SINGLE_LIMIT = telecommConfig.SMS.GSM_7BIT.LIMITS.single;

/**
 * Standard maximum character count for a concatenated (multi-part) GSM 7-bit SMS message.
 */
export const GSM_7BIT_CONCAT_MAX_CHARS = telecommConfig.SMS.GSM_7BIT.LIMITS.concatenated_max_chars;

// Export the full configuration object for advanced usage, ensuring immutability for stability
export const TELECOM_CONFIG = Object.freeze(telecommConfig);
