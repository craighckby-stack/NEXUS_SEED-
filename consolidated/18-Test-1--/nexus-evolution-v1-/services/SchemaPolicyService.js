/**
 * SchemaPolicyService (v94.2)
 * Orchestration layer responsible for fetching, resolving, merging, and compiling
 * validation functions for Artifact Indexing Policies (AIP).
 * 
 * This service abstracts the complex policy interpretation away from the lower-level
 * SchemaMergeValidator, adhering to the Single Responsibility Principle (SRP).
 */

class SchemaPolicyService {
  /**
   * @param {SchemaRegistry} schemaRegistry - Source for base schema definitions ($defs).
   * @param {SchemaMergeValidator} mergeValidator - Utility for merging and compiling.
   */
  constructor(schemaRegistry, mergeValidator) {
    this.schemaRegistry = schemaRegistry; // Assumed service for fetching definitions/policies
    this.mergeValidator = mergeValidator;
  }

  /**
   * Fetches an AIP, resolves its definitions, merges the base and custom schema,
   * and performs immediate caching/compilation via the merge validator.
   *
   * @param {string} policyId - Identifier for the policy to load.
   * @returns {Promise<Function>} A pre-compiled Ajv validation function.
   */
  async getValidator(policyId) {
    // 1. Fetch the policy (Implementation details abstracted)
    const policy = await this.schemaRegistry.getArtifactIndexingPolicy(policyId);

    if (!policy) {
        throw new Error(`Policy not found: ${policyId}`);
    }
    
    // 2. Prepare the policy structure for the validator (often required to handle external refs)
    // NOTE: If the registry handles full $ref resolution, this structure might simplify.
    // Assuming the policy structure matches what SchemaMergeValidator expects for $defs resolution:
    
    // Use the validator's validate method internally to force merge/compilation/caching.
    // We only need the validation function for validation efficiency later, not the result of validation.
    
    // HACK: To get the cached function, we might trigger a dummy validation or use a dedicated method.
    // Given the current validator structure, we need to extract the logic that produces the composite schema.
    
    // *Assumption: If a policy is loaded, we can trigger an internal validation against an empty object
    // or modify SchemaMergeValidator to expose a compile/get function directly.*
    
    // *** Refactoring SchemaMergeValidator requires moving core logic: ***
    
    // If we assume a dedicated `compile` method is added to SchemaMergeValidator (or Ajv cache is accessible):
    // const validateFn = this.mergeValidator.compilePolicy(policy);
    
    // Using the existing 'validate' function to implicitly trigger compilation and return the reusable function:
    // This is less ideal but adheres to immediate constraints:
    
    const coreSchemaRef = policy.indexing_structure?.['$ref']?.split('/')?.pop();
    if (!coreSchemaRef) {
        throw new Error(`Invalid policy structure for compilation: ${policyId}`);
    }
    
    const schemaId = `AIP-Composite-${coreSchemaRef}-${policy.custom_metadata_schema ? 'CUSTOM' : 'BASE'}`;
    let validator = this.mergeValidator.ajv.getSchema(schemaId);
    
    if (!validator) {
        // If not cached globally, force compilation.
        const { isValid } = this.mergeValidator.validate(policy, {}); 
        validator = this.mergeValidator.ajv.getSchema(schemaId);
        
        if (!validator) {
            // If compilation failed (and the exception wasn't handled gracefully above).
            throw new Error(`Failed to compile validation schema for policy ${policyId}`);
        }
    }

    return validator;
  }

  /**
   * Validates a payload against a pre-compiled policy validator.
   */
  async validatePayload(policyId, payload) {
    const validateFn = await this.getValidator(policyId);
    
    const isValid = validateFn(payload);

    return {
      isValid,
      errors: isValid ? null : validateFn.errors,
      schemaId: validateFn.schema?.$id || 'unknown'
    };
  }
}

module.exports = SchemaPolicyService;
