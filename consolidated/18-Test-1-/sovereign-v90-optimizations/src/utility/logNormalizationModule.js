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
 * before ingestion by analytic engines (GMRE, SEA, EDP). Refactored to utilize the 
 * StructuredDataValidator plugin for decoupled validation and coercion logic.
 */

class LogNormalizationModule {
    private schemaDefinition: any;
    // In a kernel environment, this would be injected or retrieved via a service.
    // We treat it as an external dependency defined by the plugin response.
    private validator: any; 

    constructor() {
        // Load externalized, immutable schema definition
        this.schemaDefinition = GOVERNANCE_SCHEMA; 
        
        // Initialize the validator plugin (kernel injection placeholder)
        // NOTE: The actual plugin instance will be provided by the AGI-KERNEL.
        this.validator = null; // Placeholder for injection/retrieval
    }

    /** 
     * Utility to map plugin error codes to module-specific error codes.
     */
    private _mapErrorCode(pluginCode: string): string {
        switch (pluginCode) {
            case 'VALIDATOR_100': return ERROR_CODES.MISSING_FIELD;
            case 'VALIDATOR_200': return ERROR_CODES.CONSTRAINT_FAIL;
            case 'VALIDATOR_300': return ERROR_CODES.COERCION_FAIL;
            default: return ERROR_CODES.RUNTIME_ERROR;
        }
    }

    /**
     * Normalizes and validates a raw log entry based on the externalized schema definition.
     * Delegates execution to the StructuredDataValidator plugin.
     * @param {Object} rawLogEntry - The raw data.
     * @returns {Object} A clean, validated log object.
     * @throws {NormalizationError} If the log entry violates the mandated schema or constraints.
     */
    normalize(rawLogEntry: any): object {
        if (!this.validator) {
             throw new NormalizationError(
                "LogNormalizationModule requires initialization of StructuredDataValidator plugin.",
                rawLogEntry, 'system', ERROR_CODES.RUNTIME_ERROR
            ); 
        }
        
        try {
            // 1. Execute external validation and coercion using the plugin
            return this.validator.execute({
                rawLogEntry: rawLogEntry,
                schemaDefinition: this.schemaDefinition
            });

        } catch (error: any) {
            // 2. Map plugin errors (ValidationError) back to the domain-specific NormalizationError
            if (error.name === 'ValidationError') { 
                 throw new NormalizationError(
                    error.message,
                    error.rawEntry,
                    error.field,
                    this._mapErrorCode(error.code) 
                );
            }
            
            // 3. Catch unexpected runtime errors
            throw new NormalizationError(
                `Unexpected LNM runtime error: ${error.message}`,
                rawLogEntry, 'runtime', ERROR_CODES.RUNTIME_ERROR
            );
        }
    }

    /**
     * Processes an array of logs, partitioning successful normalized entries from failures.
     * This resilience prevents stream halting due to isolated malformed entries.
     * @param {Array<Object>} logArray - Batch of raw log entries.
     * @returns {{success: Array<Object>, failures: Array<Object>}} Partitioned results.
     */
    processBatch(logArray: Array<any>): { success: Array<object>, failures: Array<object> } {
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
                            message: `Unexpected LNM runtime error during batch processing: ${error.message}`,
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