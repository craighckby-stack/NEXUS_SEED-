import Ajv from 'ajv';
import {
    AJV_BASE_CONFIG,
    MINIMAL_FALLBACK_SCHEMA,
    DEFAULT_GOVERNANCE_SCHEMA_PATH
} from './schema/PolicySchemaDefinitions.js';
import fs from 'fs/promises';
import { Logger } from '../utils/Logger.js'; // Assumes existence of a centralized Logger utility

/**
 * Manages the loading, compilation, and validation of governance policies
 * against defined JSON schemas using AJV. This centralizes high-assurance
 * validation logic.
 */
export class PolicyValidatorService {
    /**
     * @param {object} [dependencies] - Configuration dependencies for injection.
     * @param {Logger} [dependencies.logger] - Logger instance.
     * @param {string} [dependencies.defaultSchemaPath] - Override for primary schema path.
     */
    constructor({ 
        logger = new Logger('PolicyValidator'),
        defaultSchemaPath = DEFAULT_GOVERNANCE_SCHEMA_PATH 
    } = {}) {
        this.log = logger;
        this.schemaPath = defaultSchemaPath;

        // Initialize AJV instance with strict base configuration
        this.ajv = new Ajv(AJV_BASE_CONFIG);

        // Pre-compile fallback schema immediately for emergency use
        this.fallbackValidator = this.ajv.compile(MINIMAL_FALLBACK_SCHEMA);
        
        this.primaryValidator = null; 
        this.initialized = false;
    }

    /**
     * Attempts to load the primary governance schema from the defined path and compiles it.
     * If initialization fails, the service falls back to the minimal schema.
     * This method is idempotent and must be called before validate().
     * @returns {Promise<void>}
     */
    async initializeValidator() {
        if (this.initialized) {
            this.log.debug('Validator already initialized.');
            return;
        }

        try {
            const schemaContent = await fs.readFile(this.schemaPath, 'utf-8');
            const primarySchema = JSON.parse(schemaContent);
            
            const schemaId = primarySchema.$id || 'main-governance-schema';
            primarySchema.$id = schemaId;

            this.ajv.addSchema(primarySchema);
            const compiledValidator = this.ajv.getSchema(schemaId);
            
            if (!compiledValidator) {
                throw new Error("AJV compilation failure after schema definition.");
            }
            
            this.primaryValidator = compiledValidator;
            this.log.info(`Primary governance schema loaded successfully from ${this.schemaPath}`);
            
        } catch (error) {
            const pathMsg = `Path: ${this.schemaPath}`;
            
            if (error.code === 'ENOENT') {
                 this.log.warn(`Primary schema file not found. ${pathMsg}. Falling back.`);
            } else if (error instanceof SyntaxError) {
                 this.log.error(`Primary schema is invalid JSON. ${pathMsg}. Falling back. Error: ${error.message}`);
            } else {
                 this.log.error(`Could not initialize primary schema. ${pathMsg}. Falling back. Error: ${error.message}`);
            }
            
            this.primaryValidator = this.fallbackValidator;
        } finally {
             this.initialized = true;
        }
    }

    /**
     * Validates a configuration object against the currently loaded primary schema (or fallback).
     * @param {object} config - The configuration object to validate.
     * @returns {{isValid: boolean, errors: Array<import('ajv').ErrorObject>}} Validation result.
     * @throws {Error} If initializeValidator() has not been called.
     */
    validate(config) {
        if (!this.initialized) {
            throw new Error("Validator service must be initialized using initializeValidator() before calling validate().");
        }
        
        const validator = this.primaryValidator || this.fallbackValidator;
        
        const isValid = validator(config);
        
        return {
            isValid,
            errors: validator.errors || []
        };
    }
}