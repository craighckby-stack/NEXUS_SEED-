/**
 * SchemaMergeValidator (v94.2 - Isolated Compilation Path)
 * Utility class responsible for merging base schemas (Core Indexing Metadata)
 * with custom schema fragments defined within an Artifact Indexing Policy (AIP)
 * and performing robust validation using Ajv.
 *
 * NOTE: Relies on the PolicySchemaResolver utility for locating and extracting
 * the core schema and custom fragment from the policy object.
 */

const { resolveAIPSchemas } = require('./PolicySchemaResolver'); // New dependency

// --- [ Main Class ] -----------------------------------------------------------

class SchemaMergeValidator {
  /**
   * @param {import('ajv').Ajv} ajvInstance - The pre-configured Ajv instance.
   * @param {object} plugins - A container for reusable tools.
   */
  constructor(ajvInstance, plugins = {}) {
    if (!ajvInstance || typeof ajvInstance.compile !== 'function') {
      throw new Error('SchemaMergeValidator requires a valid Ajv instance.');
    }
    if (!plugins.JSONSchemaMerger) {
        throw new Error('SchemaMergeValidator requires the JSONSchemaMerger plugin.');
    }
    this.ajv = ajvInstance;
    this.plugins = plugins; 
    // Optimization: Pre-bind Ajv cache lookup function.
    this.getSchema = this.ajv.getSchema.bind(this.ajv);
  }

  /**
   * Generates a predictable, cacheable ID for the composite schema based on the policy references.
   * @param {string} coreSchemaRef - The identifier of the base schema (e.g., 'CoreIndexingMetadata').
   * @param {boolean} hasCustomSchema - Whether a custom fragment was applied.
   * @returns {string} Unique schema cache ID.
   */
  _generateSchemaId(coreSchemaRef, hasCustomSchema) {
      // Ensure the ref is safely integrated into the ID.
      const safeRef = coreSchemaRef.replace(/[^a-zA-Z0-9_-]/g, '_');
      return `AIP-Composite-${safeRef}-${hasCustomSchema ? 'CUSTOM' : 'BASE'}`;
  }

  /**
   * Validates a metadata payload against the policy schema. Handles schema resolution,
   * merging, compilation, and caching.
   *
   * @param {object} policy - The full ArtifactIndexingPolicy object.
   * @param {object} data - The metadata payload to validate.
   * @returns {{isValid: boolean, errors: import('ajv').ErrorObject[] | null, schemaId: string}} Validation result object.
   */
  validate(policy, data) {
    
    // 1. Delegate schema resolution to the external utility.
    const resolution = resolveAIPSchemas(policy);

    if (resolution.error || !resolution.baseSchema) {
        return {
            isValid: false,
            errors: [{ keyword: 'resolution', message: `Base schema resolution failed: ${resolution.error}` }],
            schemaId: resolution.coreSchemaRef || 'unknown'
        };
    }
    
    const { baseSchema, coreSchemaRef, customSchemaFragment } = resolution;
    
    // 2. Generate schema ID for Ajv caching.
    const schemaId = this._generateSchemaId(coreSchemaRef, !!customSchemaFragment);

    let validateFn = this.getSchema(schemaId);
    
    // --- FAST PATH: Cache Hit ---
    if (validateFn) {
        const isValid = validateFn(data);
        return {
            isValid,
            errors: isValid ? null : validateFn.errors,
            schemaId: schemaId
        };
    }

    // --- SLOW PATH: Cache Miss (Merge & Compile) ---
    try {
        // 3. Create the composite schema using the dedicated plugin.
        const compositeSchema = this.plugins.JSONSchemaMerger.execute({
          baseSchema: baseSchema,
          customSchema: customSchemaFragment
        });
        
        // 4. Compile and Register.
        this.ajv.addSchema(compositeSchema, schemaId);
        validateFn = this.getSchema(schemaId); 
        
        if (!validateFn) {
            throw new Error("Ajv compilation failed, validator function not retrieved after registration.");
        }

        // 5. Execute Validation.
        const isValid = validateFn(data);

        return {
            isValid,
            errors: isValid ? null : validateFn.errors,
            schemaId: schemaId
        };
        
    } catch (e) {
      // Handle Ajv compilation errors (e.g., malformed schemas).
      // CRITICAL: Remove potentially corrupted schema from cache.
      const message = e instanceof Error ? e.message : String(e);
      this.ajv.removeSchema(schemaId);
      return {
        isValid: false,
        errors: [{ keyword: 'compilation', message: `Schema compilation failed: ${message}` }],
        schemaId: schemaId
      };
    }
  }
}

module.exports = SchemaMergeValidator;