// Define placeholders for commonly assumed kernel interfaces if not explicitly provided in ACTIVE_TOOLS
interface ILoggerKernel {
    info(message: string): void;
    error(message: string, ...optionalParams: any[]): void;
}
interface IDataDecoderUtilityToolKernel {
    decodeJson(content: string): any;
}
interface ISchemaErrorFormatterToolKernel {
    formatErrors(errors: any[]): string;
}

// Use provided core kernel interfaces
import { ISecureResourceLoaderInterfaceKernel } from '@kernel/SecureResourceLoaderInterfaceKernel';
import { ISpecValidatorKernel } from '@kernel/ISpecValidatorKernel';
import { ISchemaComplianceConfigRegistryKernel } from './SchemaComplianceConfigRegistryKernel'; 

// Defines the expected structure for validation results
interface ValidationResult {
    isValid: boolean;
    errors: any[]; 
}

const LOG_PREFIX = '[SCE-K]';

/**
 * The SchemaComplianceEngineKernel manages the loading, registration, and orchestration 
 * of configuration validation against a specific compliance schema.
 * It strictly adheres to architectural separation via Dependency Injection (DI).
 */
export class SchemaComplianceEngineKernel {
    // Dependencies are assigned via constructor injection
    private resourceLoader: ISecureResourceLoaderInterfaceKernel;
    private decoder: IDataDecoderUtilityToolKernel;
    private specValidator: ISpecValidatorKernel;
    private errorFormatter: ISchemaErrorFormatterToolKernel;
    private configRegistry: ISchemaComplianceConfigRegistryKernel;
    private logger: ILoggerKernel;

    // State derived from configuration
    private schema: any | null = null;
    private schemaId: string | undefined;
    private isSchemaLoaded = false;
    private schemaPath!: string;
    private schemaFileName!: string;

    constructor(
        resourceLoader: ISecureResourceLoaderInterfaceKernel,
        decoder: IDataDecoderUtilityToolKernel,
        specValidator: ISpecValidatorKernel, 
        errorFormatter: ISchemaErrorFormatterToolKernel,
        configRegistry: ISchemaComplianceConfigRegistryKernel,
        logger: ILoggerKernel 
    ) {
        this.resourceLoader = resourceLoader;
        this.decoder = decoder;
        this.specValidator = specValidator;
        this.errorFormatter = errorFormatter;
        this.configRegistry = configRegistry;
        this.logger = logger;
        
        this.#setupDependencies();
    }

    /**
     * Isolates dependency initialization and synchronous state setup,
     * fulfilling the requirement for synchronous setup extraction.
     */
    private #setupDependencies(): void {
        this.schemaPath = this.configRegistry.getSchemaPath();
        this.schemaFileName = this.configRegistry.getSchemaFileName();
    }

    /**
     * Loads the schema content using the injected secure resource loader, 
     * parses it, and registers it with the specification validator.
     * 
     * @throws Error if file loading or parsing fails, or if the schema is malformed.
     */
    public async loadSchema(): Promise<void> {
        if (this.isSchemaLoaded && this.schema) {
            this.logger.info(`${LOG_PREFIX} Schema already loaded: ${this.schema.title || this.schemaFileName}`);
            return;
        }

        this.logger.info(`${LOG_PREFIX} Attempting to load compliance schema from: ${this.schemaPath}`);

        try {
            // Use the injected loader (abstracting fs/path/I/O context)
            const schemaContent = await this.resourceLoader.loadResource(this.schemaPath, { encoding: 'utf-8' });
            
            // 1. Safe JSON parsing using injected decoder
            const parsedSchema = this.decoder.decodeJson(schemaContent);
            
            if (!parsedSchema || typeof parsedSchema.$id !== 'string') {
                 throw new Error(`Invalid schema structure for ${this.schemaFileName}: missing required '$id' field or empty content.`);
            }

            this.schema = parsedSchema;
            this.schemaId = this.schema.$id;
            
            // 2. Register the schema with the validation service 
            this.specValidator.registerSchema(this.schemaId, this.schema);

            this.isSchemaLoaded = true;
            this.logger.info(`${LOG_PREFIX} Success: Registered compliance schema "${this.schema.title || this.schemaId}" (ID: ${this.schemaId}).`);

        } catch (error) {
            const errMessage = (error as Error).message;
            this.logger.error(`${LOG_PREFIX} FATAL Error during schema loading (${this.schemaFileName}): ${errMessage}`, error);
            
            throw new Error(`Compliance schema initialization failed.`);
        }
    }

    /**
     * Validates configuration data against the loaded compliance schema using the injected validator.
     * 
     * @param configPath The path/identifier of the configuration being validated (for logging).
     * @param configData The configuration object to validate.
     * @returns True if the configuration is valid, false otherwise.
     * @throws Error if the schema has not been successfully loaded prior to validation.
     */
    public validateConfig(configPath: string, configData: any): boolean {
        if (!this.isSchemaLoaded || !this.schemaId) {
            throw new Error('Compliance schema not loaded. Call loadSchema() first.');
        }
        
        // Delegate validation execution using the injected spec validator.
        const validationResult: ValidationResult = this.specValidator.validateAgainstSchema(
            this.schemaId!,
            configData
        ) as ValidationResult; 
        
        const isValid = validationResult.isValid;

        if (!isValid) {
            this.logger.error(`\n${LOG_PREFIX} VALIDATION FAILURE: Configuration file failed SPDM schema validation: ${configPath}`);
            
            // Use dedicated injected tool to standardize and display validation errors
            const formattedErrors = this.errorFormatter.formatErrors(validationResult.errors);
            this.logger.error(formattedErrors);
            this.logger.error(`------------------------------------------------------------------`);
        }
        return isValid;
    }
}