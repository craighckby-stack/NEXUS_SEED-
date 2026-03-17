import { ISchemaFormatParserToolKernel } from './ISchemaFormatParserToolKernel';
import { ICanonicalGraphGeneratorToolKernel } from './ICanonicalGraphGeneratorToolKernel';
import { IStructuralSchemaValidatorToolKernel } from './IStructuralSchemaValidatorToolKernel';
import { ISchemaParserConfigRegistryKernel } from './ISchemaParserConfigRegistryKernel';
import { ILoggerToolKernel } from '@kernel/logging'; // Assumed dependency

/**
 * ISchemaNormalizerKernel Interface
 * Mandates the contract for secure, asynchronous schema normalization.
 */
export interface ISchemaNormalizerKernel {
    /** Loads parser configuration asynchronously from the audited registry. */
    initialize(): Promise<void>;
    
    /** 
     * Converts raw schema definition into a standardized, validated, and immutable ADT graph model.
     * @returns {Promise<Readonly<object>>} The standardized, validated, and immutable graph representation.
     */
    normalize(rawSchemaDefinition: string | object, format: string): Promise<Readonly<object>>;
}

/**
 * Schema Normalizer Kernel
 * Responsibility: Securely ingest raw schema definitions and convert them into a standardized, 
 * deterministic Abstract Definition Tree (ADT) by leveraging auditable Tool Kernels 
 * for parsing, canonical generation, and structural validation.
 * 
 * This strictly adheres to AIA mandates by abstracting configuration loading and ensuring 
 * all complex computation (parsing, generation, validation) is delegated asynchronously.
 */
export class SchemaNormalizerKernel implements ISchemaNormalizerKernel {

    private parserDelegator: ISchemaFormatParserToolKernel;
    private payloadGenerator: ICanonicalGraphGeneratorToolKernel;
    private validator: IStructuralSchemaValidatorToolKernel;
    private configRegistry: ISchemaParserConfigRegistryKernel;
    private logger: ILoggerToolKernel;

    private parserRegistry: Readonly<Record<string, any>> = {};

    constructor(
        parserDelegator: ISchemaFormatParserToolKernel,
        payloadGenerator: ICanonicalGraphGeneratorToolKernel,
        validator: IStructuralSchemaValidatorToolKernel,
        configRegistry: ISchemaParserConfigRegistryKernel,
        logger: ILoggerToolKernel
    ) {
        if (!parserDelegator || !payloadGenerator || !validator || !configRegistry || !logger) {
            throw new Error("Critical dependencies missing for SchemaNormalizerKernel.");
        }
        this.parserDelegator = parserDelegator;
        this.payloadGenerator = payloadGenerator;
        this.validator = validator;
        this.configRegistry = configRegistry;
        this.logger = logger;
    }

    /**
     * Initializes the kernel by asynchronously loading the required parser configuration 
     * via the audited configuration registry.
     */
    async initialize(): Promise<void> {
        this.logger.debug("[SchemaNormalizerKernel] Initializing and loading parser registry configuration.");
        // Load configuration asynchronously, ensuring non-blocking execution.
        this.parserRegistry = Object.freeze(await this.configRegistry.getParserRegistry());
        this.logger.info(`[SchemaNormalizerKernel] Configuration loaded. Registered ${Object.keys(this.parserRegistry).length} parsers.`);
    }

    /**
     * Ingests a raw definition and converts it into a standardized schema graph model (Schema ADT).
     * @param {string | object} rawSchemaDefinition - Raw input schema data.
     * @param {string} format - The source format ('SQL', 'GraphQL', 'YAML', 'JSON_ADT').
     * @returns {Promise<Readonly<object>>} The standardized, validated, and immutable graph representation.
     */
    async normalize(rawSchemaDefinition: string | object, format: string): Promise<Readonly<object>> {
        if (!rawSchemaDefinition) {
            this.logger.error("Normalization input failed: Schema definition cannot be empty.");
            throw new Error("Schema definition cannot be empty.");
        }
        if (Object.keys(this.parserRegistry).length === 0) {
             throw new Error("SchemaNormalizerKernel not initialized or parser registry is empty.");
        }

        this.logger.info(`Starting schema normalization for format: ${format}.`);

        // 1. Parsing and Syntax Check (Delegated)
        const parsedStructure = await this.parserDelegator.execute({
            rawDefinition: rawSchemaDefinition,
            format,
            parserRegistry: this.parserRegistry // Pass immutable configuration
        });

        // 2. Dependency Mapping and Graph Construction (Canonical Generation)
        const graphModel = await this.payloadGenerator.generate(parsedStructure, { targetType: 'SchemaADT' });
        
        // 3. Validation and Consistency Check (Structural Validation)
        const validationResult = await this.validator.validate(graphModel, { context: 'Normalization' });

        if (!validationResult.isValid) {
            const errorMessages = validationResult.errors ? validationResult.errors.map(e => e.message).join(', ') : 'Unknown structural errors.';
            this.logger.crit(`Normalization failed: Structural validation error detected for format ${format}. Details: ${errorMessages}`);
            throw new Error(`Normalization failed due to structural validation errors: ${errorMessages}`);
        }

        this.logger.info(`Schema normalization successful for format: ${format}.`);
        
        // Ensure immutability for downstream consumption (e.g., SchemaAnalyzerKernel)
        return Object.freeze(graphModel);
    }
}