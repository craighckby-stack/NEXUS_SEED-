interface SchemaRegistry {
    getSchema(schemaId: string): Promise<any>;
}

interface CompilationTool {
    // Handles complex logic like calling Ajv, optimizing, etc.
    compile(schema: any): Function;
}

interface ErrorFormatterTool {
    // Standardizes the display of raw validation errors
    format(errors: any[]): string;
}

// Placeholder types for the injected plugins based on active list
type TSchemaCompilationAndValidationService = CompilationTool;
type TSchemaErrorFormatterTool = ErrorFormatterTool;

const ENFORCEMENT_SCHEMA_ID = 'enforcement_schema.json';

class SchemaCompilationKernel {
    #registry: SchemaRegistry;
    #validatorCache: Map<string, Function>;
    #compilationService: TSchemaCompilationAndValidationService;
    #errorFormatter: TSchemaErrorFormatterTool;

    constructor(
        schemaRegistry: SchemaRegistry,
        compilationService: TSchemaCompilationAndValidationService, // Delegating AJV/compilation logic
        errorFormatter: TSchemaErrorFormatterTool // Delegating error formatting
    ) {
        this.#setupDependencies({ schemaRegistry, compilationService, errorFormatter });
    }

    #throwSetupError(message: string): never {
        throw new Error(`SchemaCompilationKernel Setup Error: ${message}`);
    }

    /**
     * Goal 1: Extracts synchronous dependency assignment and initialization.
     */
    #setupDependencies(deps: {
        schemaRegistry: SchemaRegistry,
        compilationService: TSchemaCompilationAndValidationService,
        errorFormatter: TSchemaErrorFormatterTool
    }) {
        if (!deps.schemaRegistry || !deps.compilationService || !deps.errorFormatter) {
            this.#throwSetupError("Missing required dependencies (Registry, Compilation Service, or Error Formatter).");
        }
        this.#registry = deps.schemaRegistry;
        this.#compilationService = deps.compilationService;
        this.#errorFormatter = deps.errorFormatter;
        this.#validatorCache = new Map();
    }

    // --- Goal 2: I/O Proxies for Cache Management ---

    #delegateToCacheLookup(schemaId: string): Function | undefined {
        return this.#validatorCache.get(schemaId);
    }

    #delegateToCacheStore(schemaId: string, validate: Function): void {
        this.#validatorCache.set(schemaId, validate);
    }

    // --- Goal 2: I/O Proxies for External Tool Delegation ---

    async #delegateToSchemaRegistry(schemaId: string): Promise<any> {
        return this.#registry.getSchema(schemaId);
    }

    #delegateToCompilationService(schema: any): Function {
        return this.#compilationService.compile(schema);
    }

    #delegateToErrorFormatter(errors: any[]): string {
        return this.#errorFormatter.format(errors);
    }

    #executeValidator(validator: Function, data: any): boolean {
        return validator(data);
    }

    #throwFormattedValidationError(errorPrefix: string, errors: any[]): never {
        const formattedErrorDetails = this.#delegateToErrorFormatter(errors);
        throw new Error(`${errorPrefix}: ${formattedErrorDetails}`);
    }

    /**
     * Compiles and caches a schema validator function, delegating the heavy lifting.
     * @param schemaId The ID of the schema to load and compile.
     * @returns The compiled validator function.
     */
    async compileSchema(schemaId: string): Promise<Function> {
        const cachedValidator = this.#delegateToCacheLookup(schemaId);
        if (cachedValidator) {
            return cachedValidator;
        }

        const schema = await this.#delegateToSchemaRegistry(schemaId);

        // Delegation for heavy lifting
        const validate = this.#delegateToCompilationService(schema);

        this.#delegateToCacheStore(schemaId, validate);

        return validate;
    }

    /**
     * Internal helper to execute validation and handle errors consistently, throwing 
     * a formatted error on failure.
     */
    private #validateAndThrow(validator: Function, data: any, errorPrefix: string): boolean {
        const isValid = this.#executeValidator(validator, data);

        if (!isValid) {
            // Note: Errors are often attached to the function instance (e.g., Ajv)
            const errors = validator.errors || [];
            this.#throwFormattedValidationError(errorPrefix, errors);
        }
        return true;
    }

    /**
     * Loads the enforcement schema, compiles it if necessary, and validates the context data.
     * @param contextData Data to validate against the enforcement schema.
     * @throws Error if validation fails, using formatted error details.
     */
    async validateEnforcement(contextData: any): Promise<boolean> {
        const enforcementValidator = await this.compileSchema(ENFORCEMENT_SCHEMA_ID);

        return this.#validateAndThrow(
            enforcementValidator,
            contextData,
            'Enforcement context validation failed'
        );
    }
}

module.exports = SchemaCompilationKernel;