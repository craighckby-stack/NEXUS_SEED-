/**
 * Sovereign AGI v95.0 - ConfigServiceKernel
 * Function: Centralized service for loading, parsing, and providing runtime configuration parameters.
 * Enforces Dependency Injection for all configuration schema, loading logic, environment access, and logging.
 */

// --- Required Interfaces for Dependency Injection ---

/** Interface for Configuration Schema Registry (Requires ConfigSchemaRegistryKernel) */
interface IConfigSchemaRegistryKernel {
    getConfigDefinition(): Record<string, any>;
}

/** Interface for abstracting environment variables access (Replaces direct process.env access) */
interface IEnvironmentAccessKernel {
    getEnvironmentVariables(): Record<string, string>;
}

/** Interface for the Config Loader Utility (Replaces synchronous global plugin access) */
interface IConfigLoaderToolKernel {
    load(definition: Record<string, any>, envMap: Record<string, string>): Record<string, any>;
}

/** Interface for Logging Utility (Replaces synchronous console.* calls) */
interface ILoggerToolKernel {
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
}

// Define keys for configuration access (for type hinting)
type CoreConfigKeys = 'AGI_VERSION' | 'ENVIRONMENT' | 'LOG_LEVEL' | 'LOG_DESTINATION' | 'API_PORT';

class ConfigServiceKernel {
    private readonly configSchemaRegistry: IConfigSchemaRegistryKernel;
    private readonly configLoader: IConfigLoaderToolKernel;
    private readonly envAccess: IEnvironmentAccessKernel;
    private readonly logger: ILoggerToolKernel;
    
    private _config: Readonly<Record<string, any>>;

    /**
     * Initializes the Kernel using rigorous Dependency Injection.
     */
    constructor(
        configSchemaRegistry: IConfigSchemaRegistryKernel,
        configLoader: IConfigLoaderToolKernel,
        envAccess: IEnvironmentAccessKernel,
        logger: ILoggerToolKernel
    ) {
        this.configSchemaRegistry = configSchemaRegistry;
        this.configLoader = configLoader;
        this.envAccess = envAccess;
        this.logger = logger;
        this._config = {}; 
        
        // Configuration initialization is isolated to the setup method
        this.#setupConfiguration();
    }

    /**
     * Isolates synchronous setup logic, eliminating configuration loading from the constructor body.
     * Rigorously replaces synchronous internal coupling with dependency delegation.
     */
    #setupConfiguration(): void {
        const definition = this.configSchemaRegistry.getConfigDefinition();
        
        try {
            // Delegate environment access
            const envMap = this.envAccess.getEnvironmentVariables();
            
            // Delegate configuration loading and coercion
            this._config = this.configLoader.load(definition, envMap);
        } catch (e) {
            // Delegate error handling
            this.logger.error(
                `[ConfigServiceKernel] FATAL: Configuration loading failed. Falling back to default configuration defined in the registry. Error: ${e instanceof Error ? e.message : String(e)}`
            );
            
            // Fallback logic relies strictly on the injected schema defaults
            this._config = Object.keys(definition).reduce((acc, key) => {
                acc[key] = definition[key].default; 
                return acc;
            }, {} as Record<string, any>);
        }
        
        // Enforce immutability after initialization
        Object.freeze(this._config);
    }

    /**
     * Retrieves a configuration value by key.
     */
    public get<T = any>(key: CoreConfigKeys | string): T | null {
        if (!Object.prototype.hasOwnProperty.call(this._config, key)) {
            this.logger.warn(`[ConfigServiceKernel] Attempted access to undefined configuration key: ${key}. This should be defined in the injected schema registry.`);
            return null; 
        }
        return this._config[key] as T;
    }
    
    /**
     * Returns the full immutable configuration object.
     */
    public getAllConfig(): Readonly<Record<string, any>> {
        return this._config;
    }
}

// NOTE: The synchronous singleton pattern (module.exports = new ConfigService()) is eliminated.
// Consumers must use Dependency Injection.
module.exports = ConfigServiceKernel;