// ID: CSV-01 (Compliance Schema Validator)
// Purpose: Enforces structural integrity of compliance configuration files using AJV.
import Ajv from 'ajv';
import * as fs from 'fs';
import path from 'path';

import { PolicyIntegrityError } from '../errors/policyErrors.js';
// Import definitions/constants, proposed for higher organization (see scaffold proposal)
import { 
    MINIMAL_FALLBACK_SCHEMA, 
    DEFAULT_GOVERNANCE_SCHEMA_PATH,
    AJV_CONFIGURATION
} from './schema/PolicySchemaDefinitions.js';

class PolicySchemaValidator {
    /**
     * @type {Ajv}
     */
    #ajv;
    /**
     * @type {import('ajv').ValidateFunction}
     */
    #validateFunction;

    /**
     * Initializes the validator by compiling the policy governance schema.
     * @param {string} schemaPath - Optional path to the external JSON schema file.
     */
    constructor(schemaPath = DEFAULT_GOVERNANCE_SCHEMA_PATH) {
        // Use externalized configuration for maintenance ease
        this.#ajv = new Ajv(AJV_CONFIGURATION);
        
        const schema = this.#loadAndParseSchema(schemaPath);
        
        try {
            // Pre-compile schema to ensure validation performance is maximal at runtime.
            this.#validateFunction = this.#ajv.compile(schema);
        } catch (e) {
            // Indicate structural invalidity of the JSON schema itself
            console.error(`[CSV-01] AJV Compilation Failure: Schema in ${schemaPath || 'Fallback'} is invalid.`, e.message);
            throw new Error(`Failed to compile governance schema: ${e.message}`);
        }
    }

    /**
     * Loads the required JSON schema synchronously from the filesystem or uses a fallback.
     * @param {string} schemaPath 
     * @returns {object} The parsed JSON schema object.
     */
    #loadAndParseSchema(schemaPath) {
        try {
            const schemaContent = fs.readFileSync(schemaPath, 'utf8');
            // console.info(`[CSV-01] Loaded schema from ${schemaPath}.`); // Reduced unnecessary success logging
            return JSON.parse(schemaContent);
        } catch (e) {
            if (e.code === 'ENOENT') {
                console.warn(`[CSV-01] Governance schema file not found at ${schemaPath}. Utilizing defined minimal compliance fallback schema.`);
                return MINIMAL_FALLBACK_SCHEMA; 
            }
            // Catch parsing errors, permission errors, etc.
            throw new Error(`Failed to load and parse governance schema from ${schemaPath}: ${e.message}`);
        }
    }

    /**
     * Validates the provided policy configuration data against the governance schema.
     * @param {object} policyConfigData - The configuration object (e.g., from the Policy Engine, C-15).
     * @returns {true} If validation passes.
     * @throws {PolicyIntegrityError} If validation fails.
     */
    validate(policyConfigData) {
        // Sanity check for immediate input integrity
        if (!policyConfigData || typeof policyConfigData !== 'object' || Array.isArray(policyConfigData)) {
             throw new PolicyIntegrityError("Input policy configuration is not a valid object.", [{keyword: "type", message: "Input data must be a valid JSON object."}] as any);
        }

        if (!this.#validateFunction(policyConfigData)) {
            const errors = this.#validateFunction.errors || [];
            
            // Generate robust error details utilizing modern AJV fields (instancePath)
            const errorDetails = errors.map(e => {
                const dataPath = e.instancePath || e.dataPath || 'root';
                const schemaPath = e.schemaPath || 'unknown';
                return `[Path: ${dataPath}] ${e.message}. Schema Ref: ${schemaPath} (Keyword: ${e.keyword})`;
            }).join('\n');
            
            console.error(`[CSV-01] Policy Validation Failed. Errors: ${errors.length}. Details:\n${errorDetails}`);

            throw new PolicyIntegrityError(
                `Policy configuration failed strict compliance schema validation. Found ${errors.length} structural issues.`,
                errors 
            );
        }
        return true;
    }
}

export default PolicySchemaValidator;
