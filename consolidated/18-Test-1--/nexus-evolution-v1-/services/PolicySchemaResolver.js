/**
 * PolicySchemaResolver (v94.3)
 * Service responsible for taking an Artifact Indexing Policy (AIP)
 * and extracting/normalizing the required JSON Schema components (Base Schema and Custom Fragment).
 * This decouples schema definition resolution from the merging and validation steps, adhering to SRP.
 */

/**
 * @typedef {object} PolicyResolutionResult
 * @property {object | null} baseSchema - The resolved core indexing schema.
 * @property {object | null} customSchemaFragment - The optional custom metadata fragment.
 * @property {string | null} coreSchemaRef - The identifier of the base schema definition.
 * @property {string | null} error - An error message if resolution failed.
 */

class PolicySchemaResolver {

  /**
   * Resolves schema components from a full Artifact Indexing Policy object.
   * @param {object} policy - The full AIP object.
   * @returns {PolicyResolutionResult}
   */
  resolveSchemaComponents(policy) {
    if (!policy || typeof policy !== 'object') {
      return { baseSchema: null, customSchemaFragment: null, coreSchemaRef: null, error: "Input policy must be an object." };
    }

    const refPath = policy.indexing_structure?.['$ref'];
    const coreSchemaRef = refPath?.split('/')?.pop();
    const customSchemaFragment = policy.custom_metadata_schema || null;

    if (!coreSchemaRef) {
      const missingRef = refPath ? `Invalid $ref path: ${refPath}` : "Missing 'indexing_structure.$ref'.";
      return { 
        baseSchema: null, 
        customSchemaFragment,
        coreSchemaRef: 'unknown',
        error: missingRef
      };
    }

    if (!policy.$defs || !policy.$defs[coreSchemaRef]) {
      const errorMsg = `Base definition '${coreSchemaRef}' not found in policy $defs.`;
      return { 
        baseSchema: null, 
        customSchemaFragment,
        coreSchemaRef, 
        error: errorMsg
      };
    }

    return {
      baseSchema: policy.$defs[coreSchemaRef],
      customSchemaFragment,
      coreSchemaRef,
      error: null
    };
  }
}

module.exports = PolicySchemaResolver;