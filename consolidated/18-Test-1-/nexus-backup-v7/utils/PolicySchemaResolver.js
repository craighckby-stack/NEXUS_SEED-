/**
 * PolicySchemaResolver (v94.2)
 * Utility responsible for extracting, resolving, and standardizing schema components
 * referenced within an Artifact Indexing Policy (AIP).
 */

// Assuming SchemaReferenceResolverUtility is injected or available globally

/**
 * @typedef {object} JSONSchema
 * @property {object} [properties]
 * @property {string[]} [required]
 */

/**
 * Resolves the core base schema definition and custom fragment from an AIP object.
 *
 * Uses SchemaReferenceResolverUtility to safely parse the core schema reference key.
 *
 * @param {object} policy - The full ArtifactIndexingPolicy object.
 * @returns {{
 *   baseSchema: JSONSchema | null,
 *   customSchemaFragment: JSONSchema | null,
 *   coreSchemaRef: string | null,
 *   error: string | null
 * }} Resolution result.
 */
function resolveAIPSchemas(policy) {
    if (!policy || typeof policy !== 'object') {
        return { baseSchema: null, customSchemaFragment: null, coreSchemaRef: null, error: "Policy object is missing or invalid." };
    }

    // 1. Extract custom schema fragment
    const customSchemaFragment = policy.custom_metadata_schema || null;

    // 2. Extract reference path
    const refPath = policy.indexing_structure?.['$ref'];

    // 3. Use utility to parse the reference key
    // We expect SchemaReferenceResolverUtility to be available via plugin mechanism.
    const coreSchemaRef = SchemaReferenceResolverUtility.resolveRefKey(refPath);

    if (!coreSchemaRef || !policy.$defs || typeof policy.$defs !== 'object') {
        const errorMsg = coreSchemaRef
            ? `Definition structure or $defs missing.`
            : "Missing 'indexing_structure.$ref'.";
        return { baseSchema: null, customSchemaFragment, coreSchemaRef: coreSchemaRef || 'unknown', error: errorMsg };
    }

    // 4. Resolve the base schema definition
    const baseSchema = policy.$defs[coreSchemaRef] || null;

    if (!baseSchema) {
        return { 
            baseSchema: null, 
            customSchemaFragment, 
            coreSchemaRef, 
            error: `Base definition '${coreSchemaRef}' not found in $defs.` 
        };
    }

    return {
        baseSchema,
        customSchemaFragment,
        coreSchemaRef,
        error: null
    };
}

module.exports = {
    resolveAIPSchemas
};
