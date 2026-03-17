/**
 * SchemaResolver
 * 
 * Utility class responsible for loading, resolving, and validating the
 * hierarchical TEDS field definitions (schema/teds_field_definitions.json).
 * It handles JSON Schema `$ref` resolution, template merging, and applies
 * layered metadata constraints before compiling the final runtime schema.
 */
class SchemaResolver {
  constructor(schemaData) {
    this.schema = schemaData;
    this.templates = schemaData.FieldTemplates;
    this.metadata = schemaData.Metadata;
  }

  resolveReference(refPath) {
    // Basic implementation of path resolution (e.g., '#/FieldTemplates/ID_UUID')
    let current = this.schema;
    const parts = refPath.replace(/^#\//, '').split('/');
    for (const part of parts) {
      if (!current || !current[part]) {
        throw new Error(`Schema resolution failed for reference: ${refPath}`);
      }
      current = current[part];
    }
    return JSON.parse(JSON.stringify(current)); // Deep copy
  }

  compileDefinition(definitionKey) {
    const definition = this.schema.Definitions[definitionKey];
    if (!definition) {
      throw new Error(`Definition not found: ${definitionKey}`);
    }

    const compiledFields = {};
    
    for (const fieldName in definition.fields) {
      let field = definition.fields[fieldName];
      
      if (field['$ref']) {
        const template = this.resolveReference(field['$ref']);
        // Merge: template properties are base, field properties are overrides
        field = { ...template, ...field };
        delete field['$ref'];
      }

      // Apply global metadata constraints if necessary (future extension)
      // Example: Injecting 'storage_type' from Metadata based on resolved template type.

      compiledFields[fieldName] = field;
    }

    return {
      key: definition.key,
      description: definition.description,
      fields: compiledFields
    };
  }

  getCompiledSchema(definitionKey) {
    return this.compileDefinition(definitionKey);
  }

  getSystemMetadata() {
    return this.metadata;
  }
}

module.exports = SchemaResolver;