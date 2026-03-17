/**
 * @module InputVectorRouter
 * @description High-efficiency module for ingress vector validation and dynamic routing, 
 * utilizing the IVM_InputVectorManifest for operational parameters.
 */

import IVM from '../../config/IVM_InputVectorManifest.json';
import Validator from 'jsonschema'; // Placeholder for robust schema validation library
import RateLimiter from './RateLimiter';

class InputVectorRouter {
    constructor() {
        this.manifest = IVM;
        this.validator = new Validator.Validator();
        this.rateLimiter = new RateLimiter();
        // Register schemas defined in the manifest
        Object.keys(IVM.definitions).forEach(defName => {
            this.validator.addSchema(IVM.definitions[defName], `/#/definitions/${defName}`);
        });
    }

    async routeVector(inputPayload, sourceType) {
        // 1. Identify potential vectors based on sourceType, or try to infer.
        const vectorId = this.identifyVector(inputPayload, sourceType);
        if (!vectorId) throw new Error(`Vector identification failed for source: ${sourceType}`);
        
        const vectorDef = this.manifest.vectors[vectorId];

        // 2. Apply Constraints (Rate Limiting/Auth Check)
        if (vectorDef.constraints.rateLimit && !this.rateLimiter.check(vectorId)) {
            throw new Error(`Rate limit exceeded for vector: ${vectorId}`);
        }
        // (Auth checks would typically be performed here if input metadata included credentials)

        // 3. Validation against Schema
        const schemaURI = vectorDef.schemaReference;
        const validationResult = this.validator.validate(inputPayload, { $ref: schemaURI });

        if (validationResult.errors.length > 0) {
            throw new Error(`Input validation failed for ${vectorId}: ${validationResult.errors.join('; ')}`);
        }

        // 4. Successful Route
        console.log(`Vector ${vectorId} validated. Routing to ${vectorDef.targetHandler}`);
        // In a real system, this would push to a dedicated queue or call the target module.
        return {
            success: true,
            target: vectorDef.targetHandler,
            priority: vectorDef.priority,
            payload: inputPayload
        };
    }

    identifyVector(payload, sourceType) {
        // Placeholder logic: A full system would use context or defined headers to match inputs.
        // Example: if (sourceType === 'CLI' && payload.cmd) return 'VEC_USER_COMMAND_CLI';
        for (const [key, def] of Object.entries(this.manifest.vectors)) {
            if (def.sourceType === sourceType) {
                return key;
            }
        }
        return null;
    }
}

export default new InputVectorRouter();
