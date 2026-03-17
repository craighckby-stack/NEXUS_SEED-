import { IKernel } from '@core/kernel/IKernel';
import { ConfigSchemaRegistryKernel } from '@kernel/config/ConfigSchemaRegistryKernel';
import { IRegistryInitializerToolKernel } from '@tool/registry/IRegistryInitializerToolKernel';
import { SchemaDefinition } from '@types/governance/SchemaDefinition';

/**
 * Conceptual Schema Definition for the Policy Enforcement Module Engine Map.
 * Defines the required structure for tracking the status and configuration of individual PEM instances.
 */
const PEM_ENGINE_MAP_SCHEMA_DEFINITION: SchemaDefinition = {
    schemaName: 'PemEngineMapSchema',
    schemaVersion: 1,
    description: 'Schema defining the structure for the Policy Enforcement Module (PEM) Engine Map, which tracks configuration and status of individual policy engines.',
    definition: {
        type: 'map',
        keyType: 'string', // PEM Engine ID
        valueType: {
            type: 'object',
            properties: {
                engineId: { type: 'string', required: true, description: 'Unique identifier for the Policy Enforcement Engine.' },
                status: { type: 'string', required: true, enum: ['ACTIVE', 'PENDING', 'ERROR'], description: 'Operational status of the engine.' },
                configurationHash: { type: 'string', required: true, format: 'hash', description: 'Cryptographic hash of the current engine configuration.' },
                deploymentTarget: { type: 'string', required: false, description: 'Target system or environment where the engine is deployed.' },
            },
            required: ['engineId', 'status', 'configurationHash']
        }
    }
};

const PEM_ENGINE_MAP_SCHEMA_CONCEPT_ID = 'SCHEMA_ID.PEM_ENGINE_MAP';

/**
 * PemEngineMapSchemaKernel
 * This kernel registers the PemEngineMap schema definition into the centralized
 * ConfigSchemaRegistryKernel, ensuring asynchronous, non-blocking configuration flow
 * and adherence to Maximum Recursive Abstraction principles.
 */
export class PemEngineMapSchemaKernel implements IKernel {
    private isInitialized: boolean = false;

    constructor(
        private readonly configSchemaRegistry: ConfigSchemaRegistryKernel,
        private readonly registryInitializer: IRegistryInitializerToolKernel,
    ) {}

    /**
     * Registers the PemEngineMapSchema definition asynchronously.
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        await this.registryInitializer.registerSchema({
            conceptId: PEM_ENGINE_MAP_SCHEMA_CONCEPT_ID,
            schemaDefinition: PEM_ENGINE_MAP_SCHEMA_DEFINITION,
            registry: this.configSchemaRegistry,
            overwrite: false, 
        });
        
        this.isInitialized = true;
    }

    /**
     * Provides the unique concept ID for external consumers to retrieve the schema.
     */
    public getSchemaConceptId(): string {
        return PEM_ENGINE_MAP_SCHEMA_CONCEPT_ID;
    }

    // Configuration kernels typically do not have operational execute methods.
    public async execute(): Promise<any> {
        throw new Error("PemEngineMapSchemaKernel is a configuration kernel and does not support direct operational execution.");
    }
}