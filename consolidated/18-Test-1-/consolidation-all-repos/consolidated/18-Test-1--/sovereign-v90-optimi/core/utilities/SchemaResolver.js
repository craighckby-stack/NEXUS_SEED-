/**
 * SchemaResolver
 * 
 * Utility class responsible for loading, resolving, and validating the
 * hierarchical TEDS field definitions (schema/teds_field_definitions.json).
 * It utilizes the TemplateDefinitionCompiler plugin for $ref resolution and template merging.
 */

// Dependencies are now injected via the constructor.

class SchemaResolver {
  private schema: any;
  private templates: any;
  private metadata: any;
  private resolver: any; // IInternalReferenceResolverTool
  private compiler: any; // ITemplateDefinitionCompiler

  constructor(
    schemaData: any,
    resolverTool: any, // IInternalReferenceResolverTool
    compilerTool: any  // ITemplateDefinitionCompiler
  ) {
    this.#setupDependencies(resolverTool, compilerTool);
    this.#initializeConfiguration(schemaData);
  }

  /**
   * Extracts dependency resolution and validation, enforcing dependency encapsulation.
   */
  #setupDependencies(
    resolverTool: any,
    compilerTool: any
  ): void {
    // Validate tool availability (simulated injection)
    if (typeof resolverTool?.resolve !== 'function') {
        throw new Error("InternalReferenceResolverTool not correctly initialized or available.");
    }
    this.resolver = resolverTool;
    this.compiler = compilerTool;
  }

  /**
   * Extracts synchronous data assignment and configuration.
   */
  #initializeConfiguration(schemaData: any): void {
    this.schema = schemaData;
    this.templates = schemaData.FieldTemplates;
    this.metadata = schemaData.Metadata;
  }

  /**
   * Proxy function to isolate interaction with the TemplateDefinitionCompiler tool.
   * This strictly enforces architectural separation by creating an I/O proxy.
   * @param {object} field - The field definition to compile.
   * @returns {object} The resolved and merged field definition.
   */
  #delegateToCompilerResolution(field: any): any {
    return this.compiler.resolveAndMerge(
        field, 
        this.resolver, 
        this.schema
    );
  }

  /**
   * Compiles a specific definition block (e.g., a form or record type) 
   * by resolving all template references within its fields.
   * @param {string} definitionKey - The key of the definition to compile.
   * @returns {object} The compiled definition object.
   */
  compileDefinition(definitionKey: string): any {
    const definition = this.schema.Definitions[definitionKey];
    if (!definition) {
      throw new Error(`Definition not found: ${definitionKey}`);
    }

    const compiledFields = {};
    
    for (const fieldName in definition.fields) {
      let field = definition.fields[fieldName];
      
      // Use the I/O proxy for resolution and merging
      field = this.#delegateToCompilerResolution(field);

      // Apply global metadata constraints if necessary (future extension)

      compiledFields[fieldName] = field;
    }

    return {
      key: definition.key,
      description: definition.description,
      fields: compiledFields
    };
  }

  getCompiledSchema(definitionKey: string): any {
    return this.compileDefinition(definitionKey);
  }

  getSystemMetadata(): any {
    return this.metadata;
  }
}