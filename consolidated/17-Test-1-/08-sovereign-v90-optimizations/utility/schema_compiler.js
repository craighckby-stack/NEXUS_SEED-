import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

// Interface mirroring the functionality provided by the extracted plugin
interface IAjvCompilationService {
    compileAndRegister(schemas: Array<{ schema: object, id?: string }>): { success: boolean, registeredIds: string[] };
    getValidator(schemaId: string): Ajv.ValidateFunction;
}

/**
 * Simulates retrieving and initializing the AjvCompilationServiceFactory plugin.
 * In a production environment, this would involve dependency injection or a tool loading mechanism.
 * We instantiate Ajv and pass it to the service logic.
 */
function initializeCompilationService(AjvClass: typeof Ajv): IAjvCompilationService {
    const ajvInstance = new AjvClass({
        allErrors: true,
        coerceTypes: true,
        useDefaults: true
    });
    
    const service: IAjvCompilationService = {
        compileAndRegister: (schemas) => {
            const registeredIds: string[] = [];

            schemas.forEach(item => {
                const schema = item.schema;
                if (!schema || typeof schema !== 'object') return;

                // 1. Register internal definitions
                if ((schema as any).definitions) {
                    Object.entries((schema as any).definitions).forEach(([key, definition]) => {
                        if (typeof definition === 'object' && definition !== null) {
                            ajvInstance.addSchema(definition, `#/definitions/${key}`);
                        }
                    });
                }
                
                // 2. Register main schema
                const schemaId = (schema as any).$id || item.id;
                if (schemaId) {
                    ajvInstance.addSchema(schema, schemaId);
                    registeredIds.push(schemaId);
                }
            });
            return { success: true, registeredIds };
        },

        getValidator: (schemaId: string) => {
            const validator = ajvInstance.getSchema(schemaId);
            if (!validator) {
                throw new Error('Validator not found for schema ID: ' + schemaId);
            }
            // Ajv.ValidateFunction is callable
            return validator as Ajv.ValidateFunction;
        }
    };
    return service;
}


const SCHEMA_DIR = path.join(process.cwd(), 'schema/validation_definitions');

/**
 * Loads all JSON schemas from the definitions directory, compiles them using Ajv,
 * and returns the validator instance.
 * 
 * NOTE: This class now delegates all Ajv management to the IAjvCompilationService (backed by a plugin),
 * focusing only on Node.js-specific I/O (fs and path).
 */
export class SchemaCompiler {
  private compilationService: IAjvCompilationService;

  constructor() {
    // Initialize the core logic via the extracted service interface
    this.compilationService = initializeCompilationService(Ajv);
    this.loadAndCompileSchemas();
  }

  private loadAndCompileSchemas() {
    console.log(`[Schema Compiler] Loading schemas from: ${SCHEMA_DIR}`);
    
    try {
      const files = fs.readdirSync(SCHEMA_DIR);
      
      const schemasToCompile: Array<{ schema: object }> = [];
      
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const filePath = path.join(SCHEMA_DIR, file);
          // File reading and parsing (I/O concern)
          const schema = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          schemasToCompile.push({ schema });
        }
      });

      // Delegation of compilation logic to the service
      const result = this.compilationService.compileAndRegister(schemasToCompile);
      
      if (result.success) {
          result.registeredIds.forEach(id => {
              console.log(`[Schema Compiler] Registered schema: ${id}`);
          });
      }

    } catch (error) {
      console.error('Error loading or compiling schemas:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to initialize SchemaCompiler: ${error.message}`);
      }
      throw new Error('Failed to initialize SchemaCompiler.');
    }
  }

  /**
   * Retrieves a validator function for a specific schema ID.
   * For API schemas, use '$/api_schemas.json#/definitions/V1_UserCreationRequest'
   */
  public getValidator(schemaId: string): Ajv.ValidateFunction {
    return this.compilationService.getValidator(schemaId);
  }
}

export default new SchemaCompiler();