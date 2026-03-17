/**
 * RuntimeArtifactFactory: Responsible for taking a raw TEDS definition (potentially with $ref templates)
 * and transforming it into a specific, optimized runtime artifact (e.g., a Joi validation schema,
 * a Mongoose schema definition, or a GraphQL field definition).
 *
 * Optimization Insight: Implemented caching for compiled artifacts and introduced a transformer registry
 * for better extensibility and decoupling of target compilation logic.
 *
 * NOTE: Assumes DefinitionReferenceResolverTool is available in the runtime environment.
 */
class RuntimeArtifactFactory {
    /**
     * @param {Object<string, Object>} fieldTemplates - TEDS definition templates used for reference resolution ($ref)
     * @param {Object<string, function>} [externalTransformers={}] - Optional map of targetType -> transformation function
     */
    constructor(fieldTemplates, externalTransformers = {}) {
        this.fieldTemplates = fieldTemplates;
        // Cache for storing already compiled artifacts (key::targetType -> artifact)
        this._artifactCache = new Map();
        
        // Dependency Injection placeholder/instantiation for the extracted logic
        // Assuming DefinitionReferenceResolverTool is available or stubbed for execution.
        this._referenceResolver = {
            execute: (typeof DefinitionReferenceResolverTool !== 'undefined' 
                        && new DefinitionReferenceResolverTool().execute)
                     || (({ definition }) => definition) // Safe stub
        };

        // Transformer Registry: Maps target type (e.g., 'JOI') to the compilation function
        this._transformerRegistry = {
            'JOI': this._toJoiSchema.bind(this),
            ...externalTransformers
        };
    }

    /**
     * Registers a new transformation function for a specific target type.
     * @param {string} targetType - The target system identifier (e.g., 'ZOD', 'MONGOOSE').
     * @param {function} transformerFn - The function (key, resolvedDefinition) => artifact.
     */
    registerTransformer(targetType, transformerFn) {
        this._transformerRegistry[targetType.toUpperCase()] = transformerFn;
    }

    /**
     * The core transformation logic.
     * @param {string} key - The root field key being compiled.
     * @param {Object} definition - The raw definition object.
     * @param {string} targetType - 'JOI', 'ZOD', 'GQL', etc.
     * @returns {Object} The compiled artifact ready for immediate runtime use.
     */
    build(key, definition, targetType = 'JOI') {
        const normalizedTarget = targetType.toUpperCase();
        const cacheKey = `${key}::${normalizedTarget}`;

        // Step 1: Check Cache
        if (this._artifactCache.has(cacheKey)) {
            return this._artifactCache.get(cacheKey);
        }

        // Step 2: Find Transformer
        const transformer = this._transformerRegistry[normalizedTarget];
        if (!transformer) {
            throw new Error(`Unsupported artifact target type: ${targetType}. No registered transformer found.`);
        }

        // Step 3: Deep resolution of all embedded '$ref' dependencies
        const resolvedDefinition = this._referenceResolver.execute({
            definition: definition,
            fieldTemplates: this.fieldTemplates
        });
        
        // Step 4: Transformation
        const compiledArtifact = transformer(key, resolvedDefinition);

        // Step 5: Cache and Return
        this._artifactCache.set(cacheKey, compiledArtifact);
        return compiledArtifact;
    }

    /**
     * Transforms the fully resolved definition into a Joi schema object (Mock implementation).
     */
    _toJoiSchema(key, resolvedDefinition) {
        return {
            source_key: key,
            artifact_type: 'JoiSchema',
            runtime_representation: resolvedDefinition, // Mock: In real life, this is the Joi object
            is_compiled: true
        };
    }
}

module.exports = { RuntimeArtifactFactory };