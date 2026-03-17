import intentSchema from '../../governance/m01_intent_schema_v1.json'; 

/**
 * Interface defining the required capabilities of the Kernel's Schema Validation Utility.
 * This formalizes the dependency contract, replacing implicit global lookups.
 */
interface ICriticalSchemaValidator {
    initialize(config: { schemas: any[] }): boolean;
    validate(schemaId: string, data: any): { valid: boolean, errors: any[] | null };
    isInitialized(): boolean;
}

// Define the expected schema ID based on governance metadata.
const INTENT_SCHEMA_ID = 'https://agi.sovereign/schemas/intent/v2';

export interface IntentPayload {
  intent_id: string;
  version: '2.0.0';
  type: string;
  goal: string;
  priority: string;
  status: string;
  timestamp_created: string;
  // NOTE: Schema validation handles all other required properties.
}

/**
 * IntentValidator: Centralizes intent validation, enforcing explicit Dependency Management 
 * (Dependency Injection) and guaranteeing initialization of the critical governance schema
 * before execution.
 * 
 * This class replaces brittle global dependency reliance, implicit typing via `declare const`,
 * and module-level IIFE initialization.
 */
export class IntentValidator {
    // Private fields for strict encapsulation and structural integrity.
    #validator!: ICriticalSchemaValidator; // Definite assignment via #setupDependencies
    #schemaId: string = INTENT_SCHEMA_ID;
    
    /**
     * @param validator The kernel's ICriticalSchemaValidator instance (Dependency Injection).
     */
    constructor(validator: ICriticalSchemaValidator) {
        this.#setupDependencies(validator);
        this.#performSynchronousSchemaLoad();
    }

    /**
     * 1. Extracts dependency validation and assignment into a dedicated helper function.
     * Enforces Dependency Encapsulation.
     */
    #setupDependencies(validator: ICriticalSchemaValidator): void {
        // Ensure all required interface methods are present upon injection.
        if (!validator || 
            typeof validator.validate !== 'function' || 
            typeof validator.isInitialized !== 'function'
        ) {
            throw new Error("IntentValidator instantiation failed: A valid ICriticalSchemaValidator instance must be provided via constructor injection, guaranteeing validate() and isInitialized() methods.");
        }
        this.#validator = validator;
    }

    /**
     * 2. Extracts synchronous schema configuration loading, utilizing I/O proxies for external interaction.
     * Satisfies Synchronous Setup Extraction.
     */
    #performSynchronousSchemaLoad(): void {
        // We rely on the utility's implementation to handle idempotent schema registration.
        if (!this.#checkValidatorInitializationStatus()) {
            this.#delegateToValidatorInitialization(intentSchema);
        }
    }

    /**
     * 3a. I/O Proxy: Delegates checking initialization status to the external dependency.
     */
    #checkValidatorInitializationStatus(): boolean {
        return this.#validator.isInitialized();
    }

    /**
     * 3b. I/O Proxy: Delegates schema initialization to the external dependency.
     */
    #delegateToValidatorInitialization(schema: any): void {
        this.#validator.initialize({
            schemas: [schema]
        });
    }

    /**
     * 3c. I/O Proxy: Delegates the validation execution to the external dependency.
     */
    #delegateToValidatorValidation(schemaId: string, data: any): ReturnType<ICriticalSchemaValidator['validate']> {
        return this.#validator.validate(schemaId, data);
    }

    /**
     * Validates an incoming Intent object against the V2 governance schema using the Kernel's integrated validator.
     * @param intent The raw intent object.
     * @returns True if valid.
     * @throws Error with detailed validation errors if invalid.
     */
    public validateIntent(intent: any): intent is IntentPayload {
        
        const validationResult = this.#delegateToValidatorValidation(this.#schemaId, intent);
        
        if (!validationResult.valid) {
            const errors = validationResult.errors;
            
            // Log detailed errors for debugging
            console.error(`Intent validation failed against schema ${this.#schemaId}.`, errors);
            
            // Throw a structured error message detailing the failure source and errors.
            const errorDetails = errors ? JSON.stringify(errors, null, 2) : "Unknown schema validation failure.";
            
            throw new Error(`Intent validation failed: The submitted intent object did not conform to the required schema (${this.#schemaId}). Details: ${errorDetails}`);
        }
        
        return true;
    }
}