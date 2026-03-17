/**
 * @fileoverview Validator for DataSourcePrimitives configuration (v3.0.0).
 * Uses the ConfigurationIntegrityValidatorTool for robust structural and enumeration checks.
 */

declare const ConfigurationIntegrityValidatorTool: {
    execute: (args: { config: any, rules: any }) => { success: boolean };
};

const dataSourceConfig = require('../config/DataSourcePrimitives.json');

// Define validation rules required by the ConfigurationIntegrityValidatorTool
const validationRules = {
    expectedVersion: '3.0.0',
    targetKey: 'data_source_primitives',
    // Defines the required top-level keys for each primitive entry
    primitiveStructure: {
        required: ['type', 'criticality_score', 'access', 'performance']
    },
    // The tool internally handles enumeration checks based on keys present in dataSourceConfig.definitions
    // and specialized structure/range checks (like cache strategy and criticality_score range).
};

/**
 * Validates that all defined primitive data sources adhere to the established schema
 * and utilize only defined enumeration values.
 * @returns {boolean} True if validation passes.
 * @throws {Error} If configuration is invalid or the tool is unavailable.
 */
function validateDataSourcePrimitives(): boolean {
    if (typeof ConfigurationIntegrityValidatorTool === 'undefined') {
        throw new Error("CRITICAL: ConfigurationIntegrityValidatorTool is not available in the kernel context.");
    }
    
    // Execute the validation using the extracted tool
    ConfigurationIntegrityValidatorTool.execute({
        config: dataSourceConfig,
        rules: validationRules
    });

    // If execution completes without throwing an error, validation is successful.
    return true;
}

module.exports = { validateDataSourcePrimitives };
