/**
 * PolicySchemaResolver (v94.1)
 * Utility responsible for extracting, resolving, and standardizing schema components
 * referenced within an Artifact Indexing Policy (AIP).
 */

/**
 * @typedef {object} JSONSchema
 * @property {object} [properties]
 * @property {string[]} [required]
 */

/**
 * Resolves the core base schema definition and custom fragment from an AIP object.
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

    const customSchemaFragment = policy.custom_metadata_schema || null;

    const refPath = policy.indexing_structure?.['$ref'];
    const coreSchemaRef = refPath?.split('/')?.pop();

    if (!coreSchemaRef || !policy.$defs || typeof policy.$defs !== 'object') {
        const errorMsg = coreSchemaRef
            ? `Definition structure or $defs missing.`
            : "Missing 'indexing_structure.$ref'.";
        return { baseSchema: null, customSchemaFragment, coreSchemaRef: coreSchemaRef || 'unknown', error: errorMsg };
    }

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