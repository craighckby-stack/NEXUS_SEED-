/**
 * @fileoverview Validator for DataSourcePrimitives configuration (v3.0.0).
 * Ensures structural integrity and adherence to defined enumerations.
 */

const dataSourceConfig = require('../config/DataSourcePrimitives.json');

const requiredRootKeys = ['schema_version', 'definitions', 'data_source_primitives'];

/**
 * Validates that all defined primitive data sources adhere to the established schema
 * and utilize only defined enumeration values.
 * @returns {boolean} True if validation passes.
 * @throws {Error} If configuration is invalid.
 */
function validateDataSourcePrimitives() {
    if (dataSourceConfig.schema_version !== '3.0.0') {
        throw new Error(`Unsupported schema version: ${dataSourceConfig.schema_version}`);
    }

    const definitions = dataSourceConfig.definitions;

    for (const [key, primitive] of Object.entries(dataSourceConfig.data_source_primitives)) {
        // 1. Validate Structure
        if (!primitive.type || !primitive.criticality_score || !primitive.access || !primitive.performance) {
            throw new Error(`Primitive ${key} is missing required structural fields.`);
        }

        // 2. Validate Enumerations
        if (!definitions.primitive_types.includes(primitive.type)) {
            throw new Error(`Primitive ${key}: Invalid primitive type '${primitive.type}'.`);
        }
        if (!definitions.security_levels.includes(primitive.access.security_level)) {
            throw new Error(`Primitive ${key}: Invalid security level '${primitive.access.security_level}'.`);
        }
        if (!definitions.retrieval_methods.includes(primitive.access.method)) {
            throw new Error(`Primitive ${key}: Invalid retrieval method '${primitive.access.method}'.`);
        }

        // 3. Validate Performance/Caching structure
        if (!primitive.performance.cache || !['TTL', 'SWR', 'IMMUTABLE', 'NO_CACHE'].includes(primitive.performance.cache.strategy)) {
            throw new Error(`Primitive ${key}: Invalid or missing cache strategy.`);
        }
        
        // 4. Validate Criticality
        if (typeof primitive.criticality_score !== 'number' || primitive.criticality_score < 0 || primitive.criticality_score > 1) {
            throw new Error(`Primitive ${key}: criticality_score must be a float between 0 and 1.`);
        }
    }
    
    return true;
}

module.exports = { validateDataSourcePrimitives };
