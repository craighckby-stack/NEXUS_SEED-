import { ConfigurationError } from '../errors/ConfigurationError.js';

// Assume EnvironmentVariableRequirementChecker is globally available or injected by the kernel.
declare const EnvironmentVariableRequirementChecker: {
    require: (envVarName: string, processEnv: Record<string, string | undefined>) => string;
};

/**
 * Standardized utility for validating and ensuring configuration schema integrity.
 * This prevents scattered validation logic and ensures standardized error reporting
 * using ConfigurationError.
 */
export class ConfigValidator {
    /**
     * Checks if a specific environment variable is set using the dedicated environment checker plugin.
     * @param {string} envVarName - The name of the environment variable.
     * @returns {string} The value of the environment variable.
     * @throws {ConfigurationError} If the environment variable is not set.
     */
    static requireEnv(envVarName: string): string {
        try {
            // Utilize the extracted plugin for robust environment checking, passing the environment map.
            return EnvironmentVariableRequirementChecker.require(envVarName, process.env);
        } catch (error: any) {
            // The plugin throws a serialized error object (name, message, code, context).
            // We must re-instantiate the required ConfigurationError class before throwing.
            if (error && error.name === 'ConfigurationError' && error.code === 'MISSING_ENV_VAR') {
                 throw new ConfigurationError(
                    error.message, 
                    error.code, 
                    error.context
                 );
            }
            // Re-throw unexpected errors
            throw error;
        }
    }

    /**
     * Placeholder method for comprehensive schema validation (e.g., using Joi or Zod).
     * @param {Object} schema - The expected configuration schema definition.
     * @param {Object} config - The configuration object to validate.
     * @throws {ConfigurationError} On validation failure.
     */
    // static validateSchema(schema, config) { /* ... implementation ... */ }
}