import { readFileSync } from 'fs';
import Ajv, { ValidateFunction } from 'ajv';
import path from 'path';

// Use a centralized, globally accessible Ajv instance for compilation efficiency.
const ajv = new Ajv({ 
    coerceTypes: true, 
    allowUnionTypes: true 
});

/**
 * Manages dynamic loading, compilation, caching, and validation of schemas.
 * Enforces a Singleton pattern to ensure the schema cache is initialized and accessed only once,
 * maximizing computational efficiency by avoiding redundant schema loading and compilation.
 */
export class ArtifactSchemaValidator {
    private static instance: ArtifactSchemaValidator;
    // Map stores compiled Ajv functions (optimization key)
    private loadedSchemas: Map<string, ValidateFunction> = new Map();
    private schemaBasePath: string;

    /**
     * Private constructor enforces Singleton pattern.
     * Uses path.resolve for robust, platform-independent base path handling.
     */
    private constructor(schemaBasePath: string) {
        // Abstract path normalization using path module
        this.schemaBasePath = path.resolve(schemaBasePath);
    }

    /**
     * Factory method to retrieve the centralized Singleton instance.
     * This is the entry point for maximizing recursive cache efficiency.
     * @param schemaBasePath Path used only on first initialization (default: './config/schemas').
     */
    public static getInstance(schemaBasePath: string = './config/schemas'): ArtifactSchemaValidator {
        if (!ArtifactSchemaValidator.instance) {
            ArtifactSchemaValidator.instance = new ArtifactSchemaValidator(schemaBasePath);
        }
        return ArtifactSchemaValidator.instance;
    }

    /**
     * Core recursive abstraction mechanism: Loads and compiles a schema, prioritizing cache access.
     * @param schemaRef The path defined in the artifact registry.
     * @returns Compiled Ajv validation function.
     */
    private loadSchema(schemaRef: string): ValidateFunction {
        // 1. Recursive Efficiency: Check cache (Base Case/Immediate Return)
        if (this.loadedSchemas.has(schemaRef)) {
            return this.loadedSchemas.get(schemaRef)!;
        }

        // 2. Abstraction: Build the full path robustly.
        const fullPath = path.join(this.schemaBasePath, schemaRef);
        console.debug(`[ArtifactSchemaValidator] Loading schema from: ${fullPath}`);

        try {
            const schemaContent = readFileSync(fullPath, 'utf-8');
            const schema = JSON.parse(schemaContent);
            
            // 3. Computational Step: Ajv compilation (CPU intensive, happens only once per schemaRef)
            const validate = ajv.compile(schema);
            
            // 4. Cache Update (Future Efficiency)
            this.loadedSchemas.set(schemaRef, validate);
            return validate;
        } catch (error) {
            const msg = `Failed to initialize validator for schemaRef: ${schemaRef}. Ensure file exists and is valid JSON Schema at ${fullPath}.`;
            console.error(msg, error);
            throw new Error(msg);
        }
    }

    /**
     * Validates a structured data payload against the referenced artifact schema.
     * The client interacts only with validation; loading/caching is abstracted internally.
     * @param data The data object to validate.
     * @param schemaRef The reference key for the schema definition.
     * @returns True if valid.
     * @throws Error if validation fails.
     */
    public validateArtifact(data: unknown, schemaRef: string): boolean {
        const validate = this.loadSchema(schemaRef);
        const isValid = validate(data);

        if (!isValid) {
            // Highly optimized error reporting using Ajv's built-in text generator
            const errorDetails = ajv.errorsText(validate.errors, { dataVar: 'data' });
            throw new Error(`Data artifact validation failed for schema '${schemaRef}'. Details: ${errorDetails}`);
        }

        return true;
    }
}