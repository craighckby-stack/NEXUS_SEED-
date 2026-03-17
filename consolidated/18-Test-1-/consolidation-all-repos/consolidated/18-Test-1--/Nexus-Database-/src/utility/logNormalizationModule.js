const NormalizationError = require('./normalizationError');
const GOVERNANCE_SCHEMA = require('../config/governanceLogSchema'); 

// Centralized Error Code Management for structured failure analysis
const ERROR_CODES = {
    MISSING_FIELD: 'LNM_100',
    CONSTRAINT_FAIL: 'LNM_200',
    COERCION_FAIL: 'LNM_300',
    RUNTIME_ERROR: 'LNM_999'
};

/**
 * Component ID: LNM
 * Name: Log Normalization Module
 * GSEP Alignment: Stage 5 / Maintenance
 * 
 * Purpose: Ensures schema coherence and integrity validation for all governance log streams
 * before ingestion by analytic engines (GMRE, SEA, EDP). Refactored to utilize a decoupled 
 * schema configuration (governanceLogSchema) for runtime adaptability and cleaner logic flow.
 */

class LogNormalizationModule {
    constructor() {
        // Load externalized, immutable schema definition
        this.schemaDefinition = GOVERNANCE_SCHEMA; 
        this.requiredKeys = Object.keys(this.schemaDefinition);
    }

    // --- Private Utility Methods for Clarity ---

    _checkExistence(key, rawLogEntry, definition) {
        if (definition.required && !(key in rawLogEntry)) {
            throw new NormalizationError(
                `Missing required field: ${key}`,
                rawLogEntry, key, ERROR_CODES.MISSING_FIELD
            );
        }
    }

    _applyCoercion(key, value, rawLogEntry, definition) {
        if (definition.coercer && value !== undefined) {
            try {
                return definition.coercer(value);
            } catch (e) {
                throw new NormalizationError(
                    `Coercion failed for field: ${key}. Input: ${rawLogEntry[key]}. Error: ${e.message}`,
                    rawLogEntry, key, definition.error_code || ERROR_CODES.COERCION_FAIL
                );
            }
        }
        return value;
    }

    _validateIntegrity(key, value, rawLogEntry, definition) {
        // Skip validation if the field was optional and missing
        if (definition.validator && value !== undefined && !definition.validator(value)) {
            const message = definition.error 
                ? `Constraint failed: ${definition.error}` 
                : `Integrity check failed for value: ${value}`;

            throw new NormalizationError(
                message,
                rawLogEntry, key, definition.error_code || ERROR_CODES.CONSTRAINT_FAIL
            );
        }
    }


    /**
     * Normalizes and validates a raw log entry based on the externalized schema definition.
     * @param {Object} rawLogEntry - The raw data.
     * @returns {Object} A clean, validated log object.
     * @throws {NormalizationError} If the log entry violates the mandated schema or constraints.
     */
    normalize(rawLogEntry) {
        if (typeof rawLogEntry !== 'object' || rawLogEntry === null) {
             throw new NormalizationError(
                "Input must be a non-null object.",
                rawLogEntry, 'input', ERROR_CODES.CONSTRAINT_FAIL 
            );
        }
        
        const normalized = {};

        for (const key of this.requiredKeys) {
            const definition = this.schemaDefinition[key];

            // 1. Existence Check
            this._checkExistence(key, rawLogEntry, definition);
            
            let value = rawLogEntry[key];

            if (value !== undefined) {
                // 2. Coercion
                value = this._applyCoercion(key, value, rawLogEntry, definition);

                // 3. Constraint/Integrity Validation
                this._validateIntegrity(key, value, rawLogEntry, definition);
            }
            
            if (value !== undefined) {
                normalized[key] = value;
            }
        }
        
        return normalized;
    }

    /**
     * Processes an array of logs, partitioning successful normalized entries from failures.
     * This resilience prevents stream halting due to isolated malformed entries.
     * @param {Array<Object>} logArray - Batch of raw log entries.
     * @returns {{success: Array<Object>, failures: Array<Object>}} Partitioned results.
     */
    processBatch(logArray) {
        if (!Array.isArray(logArray)) {
             return { success: [], failures: [{
                rawEntry: logArray, 
                error: { message: "Batch input must be an array.", code: ERROR_CODES.RUNTIME_ERROR, name: 'TypeError' }
            }]};
        }
        
        const results = {
            success: [],
            failures: []
        };

        for (const rawLogEntry of logArray) {
            try {
                const normalizedLog = this.normalize(rawLogEntry);
                results.success.push(normalizedLog);
            } catch (error) {
                if (error instanceof NormalizationError) {
                    results.failures.push({
                        rawEntry: rawLogEntry,
                        error: {
                            message: error.message,
                            code: error.code,
                            field: error.field,
                            name: error.name
                        }
                    });
                } else {
                    // Catch internal system faults (LNM_999)
                    results.failures.push({
                        rawEntry: rawLogEntry,
                        error: {
                            message: `Unexpected LNM runtime error during normalization: ${error.message}`,
                            code: ERROR_CODES.RUNTIME_ERROR,
                            name: 'InternalRuntimeError'
                        }
                    });
                }
            }
        }
        return results;
    }
}

module.exports = LogNormalizationModule;