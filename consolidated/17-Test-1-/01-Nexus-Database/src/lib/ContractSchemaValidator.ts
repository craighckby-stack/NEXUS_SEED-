import * as fs from 'fs';
import Ajv, { ErrorObject, Schema } from 'ajv';
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
    private ajv: Ajv;
    private contract: TEDSContract;
    
    // Static helper for configuring AJV, ensuring consistent options
    private static configureAjv(): Ajv {
        const ajv = new Ajv({ 
            allErrors: true, 
            useDefaults: true, 
            allowUnionTypes: true,
            strict: true, 
            // Added crucial validation configuration: removes unexpected properties upon validation
            removeAdditional: true 
        });
        addFormats(ajv);
        return ajv;
    }

    // Allows contractPath injection for testing or flexible environment configuration
    constructor(contractPath: string = CONTRACT_PATH) {
        this.ajv = EventContractValidator.configureAjv();
        this.loadContract(contractPath);
    }

    /**
     * Synchronously loads the contract definition from the file system,
     * parses it, and immediately compiles all schemas.
     */
    private loadContract(path: string): void {
        try {
            const contractContent = fs.readFileSync(path, 'utf-8');
            this.contract = JSON.parse(contractContent) as TEDSContract;
            this.compileSchemas();
        } catch (e) {
            const err = e instanceof Error ? e : new Error(String(e));
            // Enhanced error message clarity
            const message = `Could not load or parse contract file located at ${path}. Error: ${err.message}`;
            throw new ContractInitializationError(message, err);
        }
    }

    /**
     * Compiles individual event schemas (payload + metadata wrapper) and adds them to Ajv.
     */
    private compileSchemas(): void {
        // Use destructuring for cleaner access
        const { eventTypes, defaultMetadataSchema } = this.contract;
        
        for (const eventName in eventTypes) {
            if (Object.prototype.hasOwnProperty.call(eventTypes, eventName)) {
                
                // Defines the mandatory wrapper for all events
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
                
                this.ajv.addSchema(fullSchema, eventName);
            }
        }
    }

    public validate(eventName: string, data: object): ValidationResult {
        const validate = this.ajv.getSchema(eventName);
        
        if (!validate) {
            return { 
                isValid: false, 
                errors: [{
                    message: `Schema not compiled/found for event type: ${eventName}. Ensure the event name exists in the contract.`,
                    keyword: 'missingSchema',
                    instancePath: '',
                    schemaPath: '',
                    params: { eventName } // Added context to params
                } as ErrorObject] 
            };
        }
        
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