import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

const SCHEMA_DIR = path.join(process.cwd(), 'schema/validation_definitions');

/**
 * Loads all JSON schemas from the definitions directory, compiles them using Ajv,
 * and returns the validator instance.
 */
export class SchemaCompiler {
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      coerceTypes: true,
      useDefaults: true
    });
    this.loadAndCompileSchemas();
  }

  loadAndCompileSchemas() {
    console.log(`[Schema Compiler] Loading schemas from: ${SCHEMA_DIR}`);
    
    try {
      const files = fs.readdirSync(SCHEMA_DIR);
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(SCHEMA_DIR, file);
          const schema = JSON.parse(fs.readFileSync(filePath, 'utf8'));

          // Add the schema definitions for use in other schemas via $ref
          if (schema.definitions) {
            Object.entries(schema.definitions).forEach(([key, definition]) => {
              this.ajv.addSchema(definition, `#/definitions/${key}`);
            });
          }
          
          // Compile and register the main schema (optional, but useful if the root is validated)
          if (schema.$id) {
             this.ajv.addSchema(schema, schema.$id);
             console.log(`[Schema Compiler] Registered schema: ${schema.$id}`);
          }
        }
      });
    } catch (error) {
      console.error('Error loading or compiling schemas:', error);
      throw new Error('Failed to initialize SchemaCompiler.');
    }
  }

  /**
   * Retrieves a validator function for a specific schema ID.
   * For API schemas, use '$/api_schemas.json#/definitions/V1_UserCreationRequest'
   */
  getValidator(schemaId) {
    const validator = this.ajv.getSchema(schemaId);
    if (!validator) {
      throw new Error(`Validator not found for schema ID: ${schemaId}`);
    }
    return validator;
  }
}

export default new SchemaCompiler();