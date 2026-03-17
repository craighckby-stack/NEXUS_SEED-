// src/core/data_management/ArtifactSchemaValidatorKernel.ts

import { ISpecValidatorKernel } from '../../interfaces/ISpecValidatorKernel';
import { ISecureResourceLoaderInterfaceKernel } from '../../interfaces/SecureResourceLoaderInterfaceKernel';
import { IArtifactSchemaConfigRegistryKernel } from './IArtifactSchemaConfigRegistryKernel';

/**
 * CONTRACT: ValidationResult (Mapping the output structure of ISpecValidatorKernel)
 */
interface ValidationResult {
    isValid: boolean;
    errors: Array<{ message: string, dataPath?: string }>;
    errorText?: string;
}

/**
 * Manages dynamic loading and validation of external schemas referenced by 
 * the Data Artifact Registry (via the 'schema_ref' field).
 * 
 * This Kernel ensures that structured data payloads conform 
 * to the defined governance and operational contracts at runtime using strict Dependency Injection.
 */
export class ArtifactSchemaValidatorKernel {
    private loadedSchemaRefs: Set<string>; 
    private configuredSchemaBasePath: string;
    private readonly specValidator: ISpecValidatorKernel;
    private readonly resourceLoader: ISecureResourceLoaderInterfaceKernel;
    private readonly configRegistry: IArtifactSchemaConfigRegistryKernel;

    constructor(
        specValidator: ISpecValidatorKernel,
        resourceLoader: ISecureResourceLoaderInterfaceKernel,
        configRegistry: IArtifactSchemaConfigRegistryKernel
    ) {
        // Dependency assignment, ensuring rigor and immutability of dependencies
        this.specValidator = specValidator;
        this.resourceLoader = resourceLoader;
        this.configRegistry = configRegistry;
        this.loadedSchemaRefs = new Set();
        
        // Rigorously enforce synchronous setup extraction
        this.#setupDependencies();
    }
    
    /**
     * Private method to isolate synchronous dependency setup and configuration retrieval.
     * Satisfies synchronous setup extraction and enforces architectural separation.
     */
    #setupDependencies(): void {
        // Configuration retrieved via injected registry, eliminating hardcoded path defaults
        const basePath = this.configRegistry.getArtifactSchemaBasePath();
        
        // Isolation of path normalization logic
        this.configuredSchemaBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;
    }

    /**
     * Loads, parses, and compiles a schema from the file system based on its reference path.
     * Caches the compilation result via the Spec Validator Kernel.
     */
    private ensureSchemaIsCompiled(schemaRef: string): void {
        if (this.loadedSchemaRefs.has(schemaRef)) {
            return;
        }

        const fullPath = `${this.configuredSchemaBasePath}${schemaRef}`;

        try {
            // Replaced synchronous 'fs.readFileSync' with injected synchronous resource loader method.
            const schemaContentString = this.resourceLoader.readResourceSync(fullPath, 'utf-8');
            const schema = JSON.parse(schemaContentString);
            
            // Delegate compilation and caching to the external tool (ISpecValidatorKernel)
            this.specValidator.compileAndCacheSchema(schemaRef, schema);
            
            this.loadedSchemaRefs.add(schemaRef);

        } catch (error) {
            let errorMessage = `Failed to initialize validator for schemaRef: ${schemaRef}.`;
            
            if (error instanceof Error) {
                errorMessage += ` Internal tool or processing error: ${error.message}`;
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Validates a given structured data payload against the referenced artifact schema.
     */
    public validateArtifact(data: unknown, schemaRef: string): boolean {
        // 1. Ensure schema is loaded and compiled
        this.ensureSchemaIsCompiled(schemaRef);

        // 2. Delegate validation to the external tool
        const validationResult = this.specValidator.validateData(schemaRef, data) as ValidationResult;

        if (!validationResult.isValid) {
            // Providing clear error details from the tool
            const errorDetails = validationResult.errorText || `Unknown validation error with ${validationResult.errors.length} issues.`
            throw new Error(`Data artifact validation failed for schema '${schemaRef}'. Details: ${errorDetails}`);
        }

        return true;
    }
}