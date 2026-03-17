/**
 * @module InputVectorRouter
 * @description High-efficiency module for ingress vector validation and dynamic routing, 
 * utilizing the IVM_InputVectorManifest for operational parameters.
 * 
 * Optimizations:
 * 1. Vector lookup indexed by sourceType for O(1) performance.
 * 2. Consolidated AGI service resolution during initialization.
 * 3. Simplified and hardened initialization logic for schema registration and rate limits.
 * 4. Improved error messaging (using IVR_ prefixes for easy debugging).
 */

import IVM from '../../config/IVM_InputVectorManifest.json';

// Assume SchemaValidationService and RateLimitingService are globally available 
// via the AGI kernel/plugin system (AGI.SchemaValidationService, AGI.RateLimitingService)

interface VectorDefinition {
    sourceType: string;
    constraints: {
        rateLimit: { limit: number; windowMs: number } | false;
    };
    schemaReference: string;
    targetHandler: string;
    priority: number;
}

interface Manifest {
    definitions: Record<string, any>;
    vectors: Record<string, VectorDefinition>;
}

const ManifestData: Manifest = IVM as Manifest;

// Define minimal expected service interfaces for internal typing
interface ValidatorService { 
    registerDefinitions: (def: any, ref: string) => void;
    validate: (payload: any, schema: any) => { errors?: any[] };
}
interface RateLimiterService { 
    configureLimit: (id: string, limit: number, windowMs: number) => void;
    check: (id: string) => boolean; 
}

class InputVectorRouter {
    private manifest: Manifest;
    // Indexed map for O(1) vector lookup based on source type
    private sourceVectorIndex: Record<string, string>; 
    // Resolved AGI services
    private validatorService: ValidatorService | null;
    private rateLimiterService: RateLimiterService | null;


    constructor() {
        this.manifest = ManifestData;
        this.sourceVectorIndex = {};
        
        // --- 1. Resolve AGI Services ---
        this.validatorService = (AGI.SchemaValidationService || AGI.SchemaCompilationAndValidationService) as ValidatorService || null;
        this.rateLimiterService = AGI.RateLimitingService as RateLimiterService || null;

        // --- 2. Index Vectors and Configure Rate Limits ---
        const vectors = this.manifest.vectors;
        const rateLimitConfigurable = typeof this.rateLimiterService?.configureLimit === 'function';
        
        Object.keys(vectors).forEach(vectorId => {
            const vector = vectors[vectorId];
            
            // O(1) indexing
            if (this.sourceVectorIndex[vector.sourceType]) {
                console.warn(`IVR_INIT_WARN: Duplicate sourceType definition found for: ${vector.sourceType}. Using vector ${vectorId}.`);
            }
            this.sourceVectorIndex[vector.sourceType] = vectorId;

            // Rate Limit Configuration
            const constraint = vector.constraints.rateLimit;
            if (rateLimitConfigurable && constraint) {
                this.rateLimiterService!.configureLimit(vectorId, constraint.limit, constraint.windowMs);
            }
        });
        
        if (!rateLimitConfigurable) {
            console.error("IVR_INIT_ERROR: RateLimitingService is missing or initialization failed. Rate limits will be ignored.");
            this.rateLimiterService = null; // Mark as unusable
        }

        // --- 3. Initialize and Register Schemas ---
        const schemaRegistrationAvailable = typeof this.validatorService?.registerDefinitions === 'function';

        if (schemaRegistrationAvailable) {
             Object.keys(this.manifest.definitions).forEach(defName => {
                this.validatorService!.registerDefinitions(this.manifest.definitions[defName], `/#/definitions/${defName}`);
            });
        } else {
             console.warn("IVR_INIT_WARN: Schema validation service not fully initialized or missing registration capability. Runtime validation might fail.");
             // Note: We leave this.validatorService reference potentially pointing to a partial object
             // if we detected it, but rely on the validate() check later if registration failed.
             // For robustness, we reset it if we can't even register definitions.
             this.validatorService = null;
        }
    }

    /**
     * Identifies the target vector based on sourceType using an O(1) indexed lookup.
     */
    identifyVector(payload: any, sourceType: string): string | null {
        return this.sourceVectorIndex[sourceType] || null;
    }

    async routeVector(inputPayload: any, sourceType: string) {
        // 1. Identify vector
        const vectorId = this.identifyVector(inputPayload, sourceType);
        if (!vectorId) {
            throw new Error(`IVR_IDENT_FAIL: Vector identification failed for source: ${sourceType}`);
        }
        
        const vectorDef = this.manifest.vectors[vectorId];

        // 2. Apply Constraints (Rate Limiting)
        if (vectorDef.constraints.rateLimit && this.rateLimiterService) {
            if (!this.rateLimiterService.check(vectorId)) {
                throw new Error(`IVR_RATE_LIMIT: Rate limit exceeded for vector: ${vectorId}`);
            }
        }

        // 3. Validation against Schema
        const schemaURI = vectorDef.schemaReference;
        
        if (this.validatorService && typeof this.validatorService.validate === 'function') {
            try {
                const validationResult = this.validatorService.validate(inputPayload, { $ref: schemaURI });

                if (validationResult.errors && validationResult.errors.length > 0) {
                    const errorMessages = validationResult.errors.map((e: any) => e.stack || e.message || String(e)).join('; ');
                    throw new Error(`IVR_VALIDATION_FAIL: Input validation failed for ${vectorId}. Errors: ${errorMessages}`);
                }
            } catch (e: any) {
                 // Catch errors thrown during the validation process (e.g., bad schema reference)
                 throw new Error(`IVR_VALIDATION_EXEC_FAIL: Error during schema validation for ${vectorId}. ${e.message}`);
            }
        } else {
            // This is a critical infrastructure failure
            throw new Error("IVR_CRITICAL_FAIL: Schema Validation Service is unavailable or improperly initialized. Cannot guarantee input integrity.");
        }


        // 4. Successful Route
        console.log(`Vector ${vectorId} validated. Routing to ${vectorDef.targetHandler}`);
        return {
            success: true,
            target: vectorDef.targetHandler,
            priority: vectorDef.priority,
            payload: inputPayload
        };
    }
}

export default new InputVectorRouter();