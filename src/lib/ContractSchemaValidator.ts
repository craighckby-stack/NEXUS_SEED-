import * as fs from 'fs';
import Ajv, { ErrorObject, Schema } from 'ajv';
import addFormats from 'ajv-formats';

// --- Constants & Custom Error ---

// NOTE: This path is often externalized to a configuration service for environments.
const CONTRACT_PATH = 'config/TEDS_event_contract.json';

class ContractInitializationError extends Error {
    constructor(message: string, public readonly originalError?: Error) {
        super(`Contract validation initialization failed: ${message}`);
        this.name = 'ContractInitializationError';
    }
}

// --- Interfaces for Type Safety ---

interface EventPayloadDefinition {
    payloadSchema: Schema;
    description?: string;
}

interface TEDSContract {
    version: string;
    // Using Ajv Schema type improves type coherence
    defaultMetadataSchema: Schema;
    eventTypes: {
        [eventName: string]: EventPayloadDefinition;
    };
}

interface ValidationResult {
    isValid: boolean;
    errors: ErrorObject[] | null;
}

// --- Validator Implementation ---

export class EventContractValidator {
    private ajv: Ajv;
    private contract: TEDSContract;
    
    // Allows contractPath injection for testing or flexible environment configuration
    constructor(contractPath: string = CONTRACT_PATH) {
        const ajv = new Ajv({ 
            allErrors: true, 
            useDefaults: true, 
            allowUnionTypes: true,
            strict: true // Recommended for robust schema checking
        });
        addFormats(ajv);
        this.ajv = ajv;
        
        this.loadContract(contractPath);
    }

    private loadContract(path: string): void {
        try {
            const contractContent = fs.readFileSync(path, 'utf-8');
            this.contract = JSON.parse(contractContent) as TEDSContract;
            this.compileSchemas();
        } catch (e) {
            // Replaced synchronous process exit with a specific error thrown during initialization
            const err = e instanceof Error ? e : new Error(String(e));
            throw new ContractInitializationError(
                `Could not load or parse contract file located at ${path}.`,
                err
            );
        }
    }

    private compileSchemas(): void {
        const eventTypes = this.contract.eventTypes || {};
        
        for (const eventName in eventTypes) {
            if (Object.prototype.hasOwnProperty.call(eventTypes, eventName)) {
                
                // Defines the mandatory wrapper for all events
                const fullSchema: Schema = {
                    $id: eventName, // Useful for introspection and internal Ajv indexing
                    type: 'object',
                    properties: {
                        metadata: this.contract.defaultMetadataSchema,
                        payload: eventTypes[eventName].payloadSchema
                    },
                    required: ['metadata', 'payload'],
                    additionalProperties: false, // Prevents unintended fields outside metadata/payload
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
                    params: {}
                } as ErrorObject] 
            };
        }
        
        const isValid = validate(data);
        
        return {
            isValid: isValid as boolean,
            errors: validate.errors
        };
    }

    public getContract(): TEDSContract {
        return this.contract;
    }
}