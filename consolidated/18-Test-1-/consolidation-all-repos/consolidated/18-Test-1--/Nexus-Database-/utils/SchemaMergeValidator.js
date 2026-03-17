/**
 * SchemaMergeValidator (v94.1 - Decoupled Schema Resolution)
 * Utility class responsible for merging base schemas (Core Indexing Metadata)
 * with custom schema fragments defined within an Artifact Indexing Policy (AIP)
 * and performing robust validation using Ajv.
 *
 * NOTE: Relies on the PolicySchemaResolver utility for locating and extracting
 * the core schema and custom fragment from the policy object.
 */

const { resolveAIPSchemas } = require('./PolicySchemaResolver'); // New dependency

// --- [ Internal Utilities ] ----------------------------------------------------

/**
 * @typedef {object} JSONSchema
 * @property {object} [properties]
 * @property {string[]} [required]
 * @property {boolean} [additionalProperties]
 */

/**
 * Utility function for creating a deep clone of basic JSON schema structures.
 * This ensures base schemas remain immutable during the merging process.
 * @param {JSONSchema} schema
 * @returns {JSONSchema}
 */
const deepCloneSchema = (schema) => JSON.parse(JSON.stringify(schema));


// --- [ Main Class ] -----------------------------------------------------------

class SchemaMergeValidator {
  /**
   * @param {import('ajv').Ajv} ajvInstance - The pre-configured Ajv instance.
   */
  constructor(ajvInstance) {
    if (!ajvInstance || typeof ajvInstance.compile !== 'function') {
      throw new Error('SchemaMergeValidator requires a valid Ajv instance.');
    }
    this.ajv = ajvInstance;
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
   * Creates a composite schema by performing a targeted deep merge.
   * Merges 'properties' and 'required' arrays, favoring custom settings
   * for 'additionalProperties'.
   *
   * @param {JSONSchema} baseSchema - The resolved CoreIndexingMetadata schema.
   * @param {JSONSchema | null | undefined} customSchema - The schema fragment (e.g., AIP.custom_metadata_schema).
   * @returns {JSONSchema} The merged JSON Schema.
   */
  createCompositeSchema(baseSchema, customSchema) {
    if (!customSchema || (!customSchema.properties && !customSchema.required && customSchema.additionalProperties === undefined)) {
      // Return a deep clone of the base schema if the custom fragment provides no merging instruction.
      return deepCloneSchema(baseSchema);
    }

    // 1. Deep clone the base schema to maintain source immutability.
    const merged = deepCloneSchema(baseSchema);
    
    const baseProps = merged.properties || {};
    const customProps = customSchema.properties || {};

    // 2. Merge properties: Custom properties extend/overwrite base properties.
    merged.properties = { 
      ...baseProps,
      ...customProps
    };

    // 3. Merge required fields, ensuring uniqueness and deterministic order (sorting for stability).
    const baseRequired = merged.required || [];
    const customRequired = customSchema.required || [];
    merged.required = [...new Set([...baseRequired, ...customRequired])].sort();

    // 4. Handle additionalProperties: Custom fragment explicitly overrides base if defined.
    if (customSchema.additionalProperties !== undefined) {
      merged.additionalProperties = customSchema.additionalProperties;
    }

    return merged;
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
    const hasCustomSchema = !!customSchemaFragment;
    const schemaId = this._generateSchemaId(coreSchemaRef, hasCustomSchema);

    let validateFn = this.getSchema(schemaId);
    
    try {
        if (!validateFn) {
            
            // 3. Create the composite schema (Only done if cache miss).
            const compositeSchema = this.createCompositeSchema(
              baseSchema,
              customSchemaFragment
            );
            
            // 4. Compile and Register.
            this.ajv.addSchema(compositeSchema, schemaId);
            validateFn = this.getSchema(schemaId); 
            
            if (!validateFn) {
                throw new Error("Ajv compilation failed, validator function not retrieved.");
            }
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
      const message = e instanceof Error ? e.message : String(e);
      return {
        isValid: false,
        errors: [{ keyword: 'compilation', message: `Schema compilation failed: ${message}` }],
        schemaId: schemaId
      };
    }
  }
}

module.exports = SchemaMergeValidator;