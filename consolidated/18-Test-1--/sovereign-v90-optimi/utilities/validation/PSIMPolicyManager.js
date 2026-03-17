// utilities/validation/PSIMPolicyManager.js

// Assuming these external modules/interfaces exist in the runtime environment
interface ValidationEngine {
    compile(rules: any): void;
    validate(data: any): Promise<boolean>;
}

interface Policy {
    id: string;
    rules: any;
}

interface ConfigLoaderService {
    /** Reads the configuration data, abstracting file system or network I/O. */
    readConfigFile(path: string): Promise<string>;
}

// Import necessary utility - PolicyConfigParserUtility is the new plugin
declare const PolicyConfigParserUtility: {
    execute: (args: { rawConfig: string | object }) => Policy[];
};

/**
 * Manages the loading, compilation, caching, and validation of PSIM policies.
 * Incorporates parallel processing and configuration abstraction for efficiency.
 */
class PSIMPolicyManager {
    private policyCache: Map<string, ValidationEngine>;
    private psimConfigPath: string;
    private engineFactory: () => ValidationEngine;
    private configLoader: ConfigLoaderService;
    private initialized: boolean;

    /**
     * @param psimConfigPath Path to the configuration file.
     * @param engineFactory Factory function to create new ValidationEngine instances.
     * @param configLoader Service responsible for abstracting file I/O (minimizing disk access).
     */
    constructor(
        psimConfigPath: string, 
        engineFactory: () => ValidationEngine, 
        configLoader: ConfigLoaderService
    ) {
        this.psimConfigPath = psimConfigPath;
        this.engineFactory = engineFactory;
        this.configLoader = configLoader;
        this.policyCache = new Map();
        this.initialized = false;
    }

    /**
     * Initializes the manager by loading, parsing, and compiling policies in parallel.
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;
        await this.loadPolicies();
        this.initialized = true;
    }

    /**
     * Loads and parses policy definitions using external utilities.
     */
    private async loadPolicies(): Promise<void> {
        console.log(`Loading and parsing policies from: ${this.psimConfigPath}`);
        
        let policies: Policy[] = [];
        try {
            // 1. Minimized Disk I/O: Use abstracted config loader
            const rawData = await this.configLoader.readConfigFile(this.psimConfigPath);
            
            // 2. Extracted Reusable Logic: Use PolicyConfigParserUtility to extract policies
            policies = PolicyConfigParserUtility.execute({ rawConfig: rawData });

        } catch (error) {
            console.error('Error loading or parsing PSIM configuration:', error);
            throw new Error('Policy initialization failed due to configuration issues.');
        }

        if (policies.length === 0) {
            console.warn(`No policies found in configuration at ${this.psimConfigPath}.`);
            return;
        }

        // 3. Parallel Processing: Compile policies concurrently
        const compilationPromises = policies.map(policy => this.compilePolicy(policy));
        
        // Use Promise.allSettled to handle potential individual compilation failures
        const results = await Promise.allSettled(compilationPromises);

        let successCount = 0;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
            } else {
                console.error(`[Compilation Failure] Policy ID: ${policies[index].id}. Reason:`, (result as PromiseRejectedResult).reason);
            }
        });
        
        console.log(`Successfully compiled and cached ${successCount}/${policies.length} policies.`);
    }
    
    /**
     * Helper to compile a single policy and cache it.
     */
    private async compilePolicy(policy: Policy): Promise<void> {
        if (!policy || !policy.id || !policy.rules) {
            return Promise.reject(new Error("Invalid policy structure detected. Missing ID or rules."));
        }

        const engine = this.engineFactory();
        try {
            engine.compile(policy.rules); 
            
            // 4. Memoization/Caching: Store the compiled engine
            this.policyCache.set(policy.id, engine);
        } catch (e) {
            // Use error message for detailed failure logging
            const errorMessage = e instanceof Error ? e.message : String(e);
            return Promise.reject(new Error(`Compilation failed for policy ${policy.id}: ${errorMessage}`));
        }
    }

    /**
     * Validates data against a specific cached policy.
     * @param policyId The identifier of the policy to use.
     * @param data The data payload to validate.
     * @returns True if validation passes, false otherwise.
     */
    public async validate(policyId: string, data: any): Promise<boolean> {
        if (!this.initialized) {
            throw new Error("PSIMPolicyManager must be initialized before validation.");
        }
        
        const engine = this.policyCache.get(policyId);
        
        if (!engine) {
            console.warn(`Policy ID ${policyId} not found in cache. Validation failed.`);
            return false;
        }

        return engine.validate(data); 
    }
}