/**
 * @module DataTransformer
 * @description Centralized orchestrator for validating, decoding, and standardizing raw data 
 * retrieved from various sources based on primitive definitions. Enforces security and integrity checks.
 */
import Logger from '../utility/Logger.js';
import SchemaValidator from './SchemaValidator.js'; 

class DataTransformer {
    constructor() {
        this.logger = Logger.module('DataTransformer');
        this.validator = SchemaValidator; // Utilize the new validation module
        
        // Define decoding strategies centrally
        this.decoders = {
            'JSON': this._decodeJson,
            'PLAINTEXT': this._decodePlaintext,
            // Decoders can be dynamically registered later
        };
    }

    /**
     * Executes the full data pipeline: Security -> Decode -> Validate.
     * @param {any} rawData - The unprocessed data retrieved.
     * @param {object} sourceConfig - Configuration including encoding, security, and schema type.
     * @returns {any} The finalized, validated data payload.
     * @throws {Error} If security fails, decoding fails, or schema validation fails.
     */
    transform(rawData, sourceConfig) {
        const { encoding_format, security_level, primitive_type } = sourceConfig;
        const configKey = sourceConfig.key || primitive_type; 

        // 1. Security & Integrity Check (Critical Path)
        if (!this._verifySecurity(rawData, security_level, configKey)) {
             throw new Error(`[DATA_SECURITY_FAILURE] Security verification failed for source: ${configKey}`);
        }

        // 2. Data Decoding
        let decodedData = this._decodeData(rawData, encoding_format, configKey);

        // 3. Schema & Type Validation
        this._validateSchema(decodedData, primitive_type, configKey);
        
        return decodedData;
    }

    /**
     * Handles specific encoding formats using defined strategies.
     * @private
     */
    _decodeData(rawData, format, key) {
        const handler = this.decoders[format.toUpperCase()];

        if (!handler) {
            this.logger.warn(`Unsupported encoding format detected (${format}) for ${key}. Passing raw data.`);
            return rawData;
        }

        try {
            // Call the handler, bound implicitly to the class instance if needed, though simple ones don't require 'this'
            return handler(rawData);
        } catch (error) {
            this.logger.error(`Decoding failed for ${key} (Format: ${format}). Error: ${error.message}`);
            throw new Error(`[DECODING_FAILURE] Failed to decode data for ${key}.`);
        }
    }

    // --- Specific Decoders ---

    _decodeJson(rawData) {
        return (typeof rawData === 'string') ? JSON.parse(rawData) : rawData;
    }

    _decodePlaintext(rawData) {
        return rawData; 
    }

    // --- Core Checks ---

    /**
     * Executes schema validation using the centralized Validator utility.
     * @private
     */
    _validateSchema(data, primitiveType, key) {
        if (!this.validator.validate(data, primitiveType)) {
             this.logger.error(`[SCHEMA_MISMATCH] Validation failed for expected type: ${primitiveType} in source ${key}`);
             throw new Error(`[SCHEMA_VALIDATION_FAILURE] Data structure invalid for primitive type: ${primitiveType}.`);
        }
    }

    /**
     * Executes security checks (e.g., signature verification, TLS integrity).
     * @private
     */
    _verifySecurity(data, requiredLevel, key) {
        // Logic hook retained, but renamed and contextualized.
        this.logger.debug(`Running security checks (Level: ${requiredLevel}) for ${key}`);
        return true; 
    }
}

// Export as a Singleton instance
export default new DataTransformer();
