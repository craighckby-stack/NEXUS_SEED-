// src/core/data_management/ArtifactSchemaValidator.ts

import { readFileSync } from 'fs';
import Ajv from 'ajv';

// Using Ajv for rapid runtime schema validation
const ajv = new Ajv({ 
    coerceTypes: true, // Optionally attempt type coercion
    allowUnionTypes: true 
});

/**
 * Manages dynamic loading and validation of external schemas referenced by 
 * the Data Artifact Registry (via the 'schema_ref' field).
 * 
 * This utility is critical for ensuring that structured data payloads conform 
 * to the defined governance and operational contracts at runtime.
 */
export class ArtifactSchemaValidator {
    private loadedSchemas: Map<string, Ajv.ValidateFunction>;
    private schemaBasePath: string;

    constructor(schemaBasePath: string = './config/schemas') {
        this.loadedSchemas = new Map();
        // Ensure the path ends with a separator
        this.schemaBasePath = schemaBasePath.endsWith('/') ? schemaBasePath : `${schemaBasePath}/`;
    }

    /**
     * Loads and compiles a schema from the file system based on its reference path.
     * Caches the compiled validator function for performance.
     * @param schemaRef The path defined in the artifact registry (e.g., 'CORE_TRANSACTION_EVENT.json')
     * @returns Ajv validation function.
     */
    private loadSchema(schemaRef: string): Ajv.ValidateFunction {
        if (this.loadedSchemas.has(schemaRef)) {
            return this.loadedSchemas.get(schemaRef)!;
        }

        const fullPath = `${this.schemaBasePath}${schemaRef}`;
        console.debug(`[ArtifactSchemaValidator] Attempting to load schema from: ${fullPath}`);

        try {
            const schemaContent = readFileSync(fullPath, 'utf-8');
            const schema = JSON.parse(schemaContent);
            // Compilation ensures the schema itself is valid and ready for use
            const validate = ajv.compile(schema);
            this.loadedSchemas.set(schemaRef, validate);
            return validate;
        } catch (error) {
            console.error(`Error loading or parsing schema at ${fullPath}:`, error);
            throw new Error(`Failed to initialize validator for schemaRef: ${schemaRef}. Ensure file exists and is valid JSON Schema.`);
        }
    }

    /**
     * Validates a given structured data payload against the referenced artifact schema.
     * @param data The data object to validate.
     * @param schemaRef The reference key for the schema definition (e.g., 'API_RESPONSE.json').
     * @returns True if valid.
     * @throws Error if validation fails.
     */
    public validateArtifact(data: unknown, schemaRef: string): boolean {
        const validate = this.loadSchema(schemaRef);
        const isValid = validate(data);

        if (!isValid) {
            // Providing clear error details from Ajv
            const errorDetails = ajv.errorsText(validate.errors, { dataVar: 'data' });
            throw new Error(`Data artifact validation failed for schema '${schemaRef}'. Details: ${errorDetails}`);
        }

        return true;
    }
}