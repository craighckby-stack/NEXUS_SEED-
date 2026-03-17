import { ConfigurationError } from '../errors/ConfigurationError.js';

/**
 * Standardized utility for validating and ensuring configuration schema integrity.
 * This prevents scattered validation logic and ensures standardized error reporting
 * using ConfigurationError.
 */
export class ConfigValidator {
    /**
     * Checks if a specific environment variable is set.
     * @param {string} envVarName - The name of the environment variable.
     * @returns {string} The value of the environment variable.
     * @throws {ConfigurationError} If the environment variable is not set.
     */
    static requireEnv(envVarName) {
        const value = process.env[envVarName];
        if (!value) {
            throw new ConfigurationError(
                `Required environment variable is missing: ${envVarName}`,
                'MISSING_ENV_VAR',
                { variable: envVarName, advice: 'Check .env file or deployment configuration.' }
            );
        }
        return value;
    }

    /**
     * Placeholder method for comprehensive schema validation (e.g., using Joi or Zod).
     * @param {Object} schema - The expected configuration schema definition.
     * @param {Object} config - The configuration object to validate.
     * @throws {ConfigurationError} On validation failure.
     */
    // static validateSchema(schema, config) { /* ... implementation ... */ }
}