/**
 * SchemaRegistry
 * Manages standardized base schemas and pre-registers them with the shared Ajv instance.
 * This decouples core structural definitions (like CoreIndexingMetadata) from policy validation logic
 * and enables efficient schema resolution via $ref within Ajv.
 */
class SchemaRegistry {
  /**
   * @param {Ajv} ajvInstance - The shared Ajv instance.
   */
  constructor(ajvInstance) {
    this.ajv = ajvInstance;
    this.definitions = {};
  }

  /**
   * Loads and registers a core schema definition into Ajv.
   * The schema MUST contain an $id field used for Ajv registration and resolution.
   * @param {object} schema - The standardized JSON Schema.
   * @param {string} name - Internal name for tracking (optional, uses schema.$id if available).
   */
  registerSchema(schema, name) {
    const id = schema.$id || name;
    if (!id) {
      throw new Error('Cannot register schema without an $id field or name.');
    }
    
    // Ajv requires a base schema ID for external $ref resolution if using draft 2019-09 or newer.
    this.ajv.addSchema(schema, id);
    this.definitions[id] = schema;
    console.log(`SchemaRegistry: Registered definition ${id}`);
  }

  /**
   * Retrieves a registered base schema.
   * @param {string} id - The $id of the schema.
   * @returns {object | undefined}
   */
  getSchema(id) {
    return this.definitions[id];
  }

  /**
   * Static definitions for core components (Example definition).
   * In production, this would load files from a defined schema directory.
   */
  static get CoreIndexingMetadataSchema() {
    return {
      $id: 'CoreIndexingMetadata',
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: 'Core Indexing Metadata',
      type: 'object',
      properties: {
        artifact_id: { type: 'string', description: 'Unique artifact identifier.' },
        created_timestamp: { type: 'string', format: 'date-time' },
        version: { type: 'integer' }
      },
      required: ['artifact_id', 'created_timestamp'],
      additionalProperties: false
    };
  }

  /**
   * Initialize the registry with all standardized core schemas.
   */
  initialize() {
    // Load standardized schemas here
    this.registerSchema(SchemaRegistry.CoreIndexingMetadataSchema);
    // Add other standardized schemas (e.g., PolicyDefinitions, AccessControlSchema) as needed.
  }
}

module.exports = SchemaRegistry;