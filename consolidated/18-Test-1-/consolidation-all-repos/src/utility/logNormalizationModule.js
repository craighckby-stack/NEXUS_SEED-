/**
 * Custom error class for structured normalization failures.
 * Merged from normalizationError.js to comply with pruning directives (0-5 line file deletion).
 */
class NormalizationError extends Error {
    constructor(message, rawEntry, field, code = 'LNM_000') {
        super(message);
        this.name = 'NormalizationError';
        this.rawEntry = rawEntry;
        this.field = field;
        this.code = code;
        // Ensure the prototype chain is correctly set up for instanceof checks
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NormalizationError);
        }
    }
}

/**
 * Component ID: LNM
 * Name: Log Normalization Module
 * GSEP Alignment: Stage 5 / Maintenance
 * 
 * Purpose: Ensures schema coherence and integrity validation for all governance log streams
 * before ingestion by analytic engines (GMRE, SEA, EDP). Refactored for structured schema
 * management, type coercion, and resilient batch processing.
 */

class LogNormalizationModule {
    constructor() {
        // Structured Schema Definition for precise validation and automated coercion.
        // Defines required fields, coercion methods, and integrity validators.
        this.schemaDefinition = {
            timestamp: { 
                required: true, 
                coercer: (val) => new Date(val).toISOString(), 
                validator: (val) => val.includes('T') && !isNaN(Date.parse(val)),
                error_code: 'LNM_401'
            },
            component_id: { 
                required: true, 
                coercer: (val) => String(val).toUpperCase(),
                error_code: 'LNM_402'
            },
            status_code: { 
                required: true, 
                coercer: Number, 
                validator: Number.isInteger, 
                error_code: 'LNM_403' 
            }, 
            gsep_stage: { 
                required: true, 
                coercer: Number, 
                validator: (val) => val >= 1 && val <= 5, 
                error_code: 'LNM_404', 
                error: 'GSEP stage index out of bounds (1-5)'
            },
            input_hash: { 
                required: true, 
                coercer: String, 
                validator: (val) => typeof val === 'string' && val.length >= 10, 
                error_code: 'LNM_405' 
            }
        };
        
        this.requiredKeys = Object.keys(this.schemaDefinition);
    }

    /**
     * Normalizes and validates a raw log entry. Utilizes the internal schema definition.
     * @param {Object} rawLogEntry - The raw data.
     * @returns {Object} A clean, validated log object.
     * @throws {NormalizationError} If the log entry violates the mandated schema or constraints.
     */
    normalize(rawLogEntry) {
        const normalized = {};

        for (const key of this.requiredKeys) {
            const definition = this.schemaDefinition[key];

            // 1. Existence Check
            if (definition.required && !(key in rawLogEntry)) {
                throw new NormalizationError(
                    `Missing required field: ${key}`,
                    rawLogEntry, key, 'LNM_100' 
                );
            }

            let value = rawLogEntry[key];

            // 2. Coercion
            if (definition.coercer) {
                try {
                    value = definition.coercer(value);
                } catch (e) {
                    throw new NormalizationError(
                        `Coercion failed for field: ${key}. Input: ${rawLogEntry[key]}`,
                        rawLogEntry, key, definition.error_code || 'LNM_300' 
                    );
                }            }

            // 3. Constraint/Integrity Validation
            if (definition.validator && !definition.validator(value)) {
                const message = definition.error 
                    ? `Constraint failed: ${definition.error}` 
                    : `Integrity check failed for value: ${value}`;

                throw new NormalizationError(
                    message,
                    rawLogEntry, key, definition.error_code || 'LNM_200'
                );
            }

            normalized[key] = value;
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
                    // Catch internal system faults
                    results.failures.push({
                        rawEntry: rawLogEntry,
                        error: {
                            message: `Unexpected LNM runtime error: ${error.message}`,
                            code: 'LNM_999',
                            name: 'InternalRuntimeError'
                        }
                    });
                }
            }
        }
        return results;
    }
}

module.exports = { LogNormalizationModule, NormalizationError };
