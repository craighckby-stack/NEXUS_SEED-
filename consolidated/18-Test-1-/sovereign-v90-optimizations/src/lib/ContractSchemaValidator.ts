import * as fs from 'fs';
import Ajv, { ErrorObject, Schema, ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

// --- Constants & Custom Error ---

const CONTRACT_PATH = 'config/TEDS_event_contract.json';

export class ContractInitializationError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(`Contract validation initialization failed: ${message}`);
        this.name = 'ContractInitializationError';
    }
}

// --- Interfaces for Type Safety ---

export interface EventPayloadDefinition {
    payloadSchema: Schema;
    description?: string;
}

export interface TEDSContract {
    version: string;
    // Using Ajv Schema type improves type coherence
    defaultMetadataSchema: Schema;
    eventTypes: {
        [eventName: string]: EventPayloadDefinition;
    };
}

export interface ValidationResult {
    isValid: boolean;
    errors: ErrorObject[] | null;
}

// --- Validator Implementation ---

export class EventContractValidator {
    // Stores compiled validation functions, replacing direct Ajv instance storage
    private validatorMap: Map<string, ValidateFunction>;
    private contract: TEDSContract;
    
    // Allows contractPath injection for testing or flexible environment configuration
    constructor(contractPath: string = CONTRACT_PATH) {
        const parsedContract = this.loadContract(contractPath);
        this.contract = parsedContract;

        try {
            // 1. Configure Ajv Environment (TS responsibility, replacing static helper)
            const ajv = new Ajv({ 
                allErrors: true, 
                useDefaults: true, 
                allowUnionTypes: true,
                strict: true, 
                removeAdditional: true 
            });
            addFormats(ajv);

            // 2. Compile Schemas using the core structural logic (extracted to plugin)
            this.validatorMap = this.compileSchemas(ajv, parsedContract);

        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            throw new ContractInitializationError(`Schema compilation failed during initialization. Error: ${err.message}`, err);
        }
    }

    /**
     * Synchronously loads the contract definition from the file system, parses it. (I/O)
     */
    private loadContract(path: string): TEDSContract {
        try {
            const contractContent = fs.readFileSync(path, 'utf-8');
            return JSON.parse(contractContent) as TEDSContract;
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            // Enhanced error message clarity
            const message = `Could not load or parse contract file located at ${path}. Error: ${err.message}`;
            throw new ContractInitializationError(message, err);
        }
    }

    /**
     * Compiles individual event schemas using the reusable structural logic.
     * (This method conceptually replaces the original compileSchemas, relying on extracted logic)
     */
    private compileSchemas(ajv: Ajv, contract: TEDSContract): Map<string, ValidateFunction> {
        const { eventTypes, defaultMetadataSchema } = contract;
        const validationMap = new Map<string, ValidateFunction>();
        
        for (const eventName in eventTypes) {
            if (Object.prototype.hasOwnProperty.call(eventTypes, eventName)) {
                
                // Core structural logic: wrapping payload with default metadata
                const fullSchema: Schema = {
                    $id: eventName, 
                    type: 'object',
                    properties: {
                        metadata: defaultMetadataSchema,
                        payload: eventTypes[eventName].payloadSchema
                    },
                    required: ['metadata', 'payload'],
                    additionalProperties: false,
                };
                
                ajv.addSchema(fullSchema, eventName);
                
                const validator = ajv.getSchema(eventName);
                if (!validator) {
                    // If addSchema or getSchema fails, initialization should fail explicitly
                    throw new Error(`Failed to retrieve validator after adding schema for: ${eventName}`);
                }
                validationMap.set(eventName, validator as ValidateFunction);
            }
        }
        
        return validationMap;
    }

    public validate(eventName: string, data: object): ValidationResult {
        const validate = this.validatorMap.get(eventName);
        
        if (!validate) {
            return { 
                isValid: false, 
                errors: [{
                    message: `Schema not compiled/found for event type: ${eventName}. Ensure the event name exists in the contract.`,
                    keyword: 'missingSchema',
                    instancePath: '',
                    schemaPath: '',
                    params: { eventName } as any
                } as ErrorObject] 
            };
        }
        
        // The validator modifies the 'data' object if useDefaults is true.
        const isValid = validate(data) as boolean;
        
        return {
            isValid: isValid,
            errors: validate.errors
        };
    }

    public getContract(): TEDSContract {
        return this.contract;
    }
}