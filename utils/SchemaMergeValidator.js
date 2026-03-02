/**
 * SchemaMergeValidator (v94.3 - Refactored for Separation of Concerns Readiness)
 * Utility class responsible for merging base schemas (Core Indexing Metadata)
 * with custom schema fragments defined within an Artifact Indexing Policy (AIP)
 * and performing robust validation using Ajv.
 *
 * NOTE: Assumes Ajv instance is configured for desired schema dialect (e.g., draft 7/2020-12).
 * This utility focuses primarily on merging, compilation, and validation.
 * Policy structure resolution logic has been isolated into a helper for potential future extraction (see architectural proposal).
 */

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
const _cloneSchema = (schema) => JSON.parse(JSON.stringify(schema));

class SchemaMergeValidator {
  /**
   * @param {import('ajv').Ajv} ajvInstance - The pre-configured Ajv instance.
   */
  constructor(ajvInstance) {
    if (!ajvInstance || typeof ajvInstance.compile !== 'function') {
      throw new Error('SchemaMergeValidator requires a valid Ajv instance.');
    }
    this.ajv = ajvInstance;
  }

  /**
   * Generates a predictable, cacheable ID for the composite schema based on the policy references.
   * @param {string} baseRef - The identifier of the base schema.
   * @param {boolean} hasCustomSchema - Whether a custom fragment was applied.
   * @returns {string} Unique schema cache ID.
   */
  _generateSchemaId(baseRef, hasCustomSchema) {
      return `AIP-Composite-${baseRef}-${hasCustomSchema ? 'CUSTOM' : 'BASE'}`;
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
      return _cloneSchema(baseSchema);
    }

    // 1. Deep clone the base schema to maintain source immutability.
    const merged = _cloneSchema(baseSchema);
    
    const baseProps = merged.properties || {};
    const customProps = customSchema.properties || {};

    // 2. Merge properties: Custom properties extend/overwrite base properties.
    merged.properties = { 
      ...baseProps,
      ...customProps
    };

    // 3. Merge required fields, ensuring uniqueness and deterministic order.
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
   * Helper function to extract and resolve the base schema reference from the AIP structure.
   * NOTE: This logic is a candidate for extraction into a PolicySchemaResolver service.
   * 
   * @param {object} policy - The full ArtifactIndexingPolicy object.
   * @returns {{baseSchema: JSONSchema | null, coreSchemaRef: string | null, error: string | null}}
   */
  _resolveBaseSchema(policy) {
    const refPath = policy.indexing_structure?.['$ref'];
    const coreSchemaRef = refPath?.split('/')?.pop();

    if (!coreSchemaRef || !policy.$defs || !policy.$defs[coreSchemaRef]) {
        const errorMsg = coreSchemaRef 
            ? `Definition '${coreSchemaRef}' not found in $defs.`
            : (refPath ? `Invalid $ref path: ${refPath}` : "Missing 'indexing_structure.$ref'.");
        return { baseSchema: null, coreSchemaRef: coreSchemaRef || 'unknown', error: errorMsg };
    }

    return {
        baseSchema: policy.$defs[coreSchemaRef],
        coreSchemaRef,
        error: null
    };
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
    
    // 1. Resolve base schema and fragment.
    const resolution = this._resolveBaseSchema(policy);

    if (resolution.error) {
        return {
            isValid: false,
            errors: [{ keyword: 'resolution', message: `Base schema definition error: ${resolution.error}` }],
            schemaId: resolution.coreSchemaRef
        };
    }
    
    const baseSchema = resolution.baseSchema;
    const coreSchemaRef = resolution.coreSchemaRef;
    const customSchemaFragment = policy.custom_metadata_schema;
    
    // 2. Create the composite schema.
    const compositeSchema = this.createCompositeSchema(
      baseSchema,
      customSchemaFragment
    );
    
    // 3. Generate schema ID for Ajv caching.
    const schemaId = this._generateSchemaId(coreSchemaRef, !!customSchemaFragment);

    let validateFn;
    
    try {
        validateFn = this.ajv.getSchema(schemaId);

        if (!validateFn) {
            // Compile the dynamic schema and register it.
            this.ajv.addSchema(compositeSchema, schemaId);
            validateFn = this.ajv.getSchema(schemaId); 
            
            if (!validateFn) {
                throw new Error("Ajv compilation failed to return validation function after successful add.");
            }
        }

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