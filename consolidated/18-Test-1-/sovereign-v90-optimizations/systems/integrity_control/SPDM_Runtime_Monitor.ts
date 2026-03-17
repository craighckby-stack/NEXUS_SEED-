// Purpose: Enforce runtime immutability and cryptographic integrity of critical SPDM scalars.
// Dependencies: CanonicalConfigurationIntegrityInitializer, Configuration Loader service (Mocked).

import { IntegrityError, NotFoundError } from './errors'; // Assume custom errors exist

interface ICanonicalConfigurationIntegrityInitializer {
    initializeAndLock(configData: any, expectedSignature: string): { 
        success: boolean; 
        error?: string; 
        parameters?: Map<string, any>; // Map<string, { value: number }>
        hash?: string;
    };
}

// Global scope access to the kernel plugin (simulated injection)
declare const CanonicalConfigurationIntegrityInitializer: ICanonicalConfigurationIntegrityInitializer;

// Mock External Loader (Replace with actual data fetching/loading utility in production)
const MockConfigurationLoader = {
    async loadAndValidate(configPath: string): Promise<any> {
        // Placeholder for actual IO/Fetch logic
        console.log(`Loading configuration from ${configPath}`);
        // Mock structure matching expected parameter_groups
        return {
            system_id: "SPDM_CORE",
            parameter_groups: {
                group_a: { parameters: { TIMEOUT_MS: { value: 500 }, RETRIES: { value: 3 } } },
                group_b: { parameters: { MAX_SIZE: { value: 4096 } } }
            }
        };
    }
};

export class SPDM_Runtime_Monitor {
    private static _config_locked: boolean = false;
    // Stores normalized parameters (e.g., Map<"TIMEOUT_MS", { value: 500 }>)
    private static _loaded_parameters: Map<string, { value: number }>; 

    /**
     * Initializes the monitor by loading, verifying integrity, normalizing, and locking the configuration.
     */
    public static async initialize(configPath: string, expectedManifestSignature: string): Promise<void> {
        
        // 1. Load data using an appropriate utility (Mocked for demonstration)
        const configData = await MockConfigurationLoader.loadAndValidate(configPath);

        // 2. Execute secure initialization and locking using the dedicated tool
        const initializationResult = CanonicalConfigurationIntegrityInitializer.initializeAndLock(
            configData,
            expectedManifestSignature
        );

        if (!initializationResult.success) {
            // Error handling from hash mismatch or missing data
            throw new IntegrityError(initializationResult.error || 'Unknown SPDM Initialization failure.');
        }

        // 3. Store the immutably locked parameters
        this._loaded_parameters = initializationResult.parameters as Map<string, { value: number }>;
        this._config_locked = true;
        console.log(`SPDM configuration locked. Integrity Hash Verified.`);
    }

    /**
     * Retrieves a scalar configuration value by key.
     */
    public static getScalar(key: string): number {
        if (!this._config_locked) {
            throw new Error('SPDM configuration access requested before lockdown completion.');
        }
        if (!this._loaded_parameters.has(key)) {
            throw new NotFoundError(`SPDM parameter '${key}' not found.`);
        }
        
        const param = this._loaded_parameters.get(key);
        // Validate parameter structure and type based on usage
        if (!param || typeof param.value !== 'number') {
             throw new TypeError(`SPDM parameter '${key}' is not a valid scalar number structure.`);
        }
        return param.value;
    }
    
    // The original flattenParameters method has been moved into the plugin.
}