/**
 * RuntimeArtifactFactory: Responsible for taking a raw TEDS definition (potentially with $ref templates)
 * and transforming it into a specific, optimized runtime artifact (e.g., a Joi validation schema,
 * a Mongoose schema definition, or a GraphQL field definition).
 */
class RuntimeArtifactFactory {
    constructor(fieldTemplates) {
        // TEDS definition templates used for reference resolution ($ref)
        this.fieldTemplates = fieldTemplates;
    }

    /**
     * The core transformation logic.
     * @param {string} key - The root field key being compiled.
     * @param {Object} definition - The raw definition object.
     * @param {string} targetType - 'JOI', 'ZOD', 'GQL', etc.
     * @returns {Object} The compiled artifact ready for immediate runtime use.
     */
    build(key, definition, targetType = 'JOI') {
        // Step 1: Deep resolution of all embedded '$ref' dependencies against this.fieldTemplates
        const resolvedDefinition = this._resolveReferences(definition);
        
        // Step 2: Transformation based on the target system 
        switch (targetType.toUpperCase()) {
            case 'JOI':
                return this._toJoiSchema(key, resolvedDefinition);
            // Add cases for other target types (ZOD, Mongoose, etc.) here
            default:
                throw new Error(`Unsupported artifact target type: ${targetType}`);
        }
    }

    /**
     * Recursively traverses the definition object and merges in referenced templates.
     * NOTE: This is a placeholder for complex JSON Schema-like reference resolution logic.
     * @param {Object} def
     * @returns {Object}
     */
    _resolveReferences(def) {
        // Basic placeholder logic
        if (def && typeof def === 'object' && def.$ref) {
            const templateName = def.$ref;
            const template = this.fieldTemplates[templateName];
            if (template) {
                // Deep merge logic would ensure properties in 'def' override 'template' properties
                const merged = { ...template, ...def };
                delete merged.$ref; 
                return this._resolveReferences(merged); // Recurse
            }
        }
        
        // Ensure deep traversal for nested structures
        if (typeof def === 'object' && def !== null && !Array.isArray(def)) {
            const newDef = {};
            for (const prop in def) {
                if (Object.prototype.hasOwnProperty.call(def, prop)) {
                    newDef[prop] = this._resolveReferences(def[prop]);
                }
            }
            return newDef;
        }
        
        return def;
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