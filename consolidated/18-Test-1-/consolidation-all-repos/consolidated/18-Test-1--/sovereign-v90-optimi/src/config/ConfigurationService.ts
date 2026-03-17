/**
 * Placeholder Interfaces for Dependency Injection
 */
interface IEnvironmentAccessKernel {
    getEnvironmentVariable(key: string): string | undefined;
}

interface ISystemPathResolverKernel {
    // Must handle path resolution and root calculation relative to context
    calculateProjectRoot(currentModulePath: string): string;
    joinPath(...paths: string[]): string;
}

interface IConfigCoercerToolKernel {
    coerce(options: {
        source: Record<string, any>;
        key: string;
        defaultValue: any;
        type: 'number' | 'enum' | 'string';
        validation?: Record<string, any>;
    }): any;
}

// --- Type Definition for Configuration Structure (Kept for compatibility) ---
export interface Configuration {
    NODE_ENV: 'development' | 'production' | 'test';
    PROJECT_ROOT: string;
    SERVER_PORT: number;
    LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
    EVENT_CONTRACT_PATH: string;
}

/**
 * ConfigurationKernel provides centralized, strongly-typed access to 
 * system configurations, enforcing Dependency Injection and architectural separation.
 * It replaces the static ConfigurationService.
 */
export class ConfigurationKernel {
    private config: Configuration | null = null;
    
    // Dependencies
    private readonly environmentAccessKernel: IEnvironmentAccessKernel;
    private readonly pathResolverKernel: ISystemPathResolverKernel;
    private readonly coercerToolKernel: IConfigCoercerToolKernel;

    // Context needed for path calculation (e.g., __dirname)
    private readonly moduleDirContext: string;

    // Internal Constants (Extracted from global scope)
    private readonly NODE_ENV_VALUES: Configuration['NODE_ENV'][] = ['development', 'production', 'test'];
    private readonly LOG_LEVEL_VALUES: Configuration['LOG_LEVEL'][] = ['debug', 'info', 'warn', 'error'];
    private readonly DEFAULT_CONFIG: Partial<Configuration> = {
        NODE_ENV: 'development',
        SERVER_PORT: 3000,
        LOG_LEVEL: 'info',
    };

    constructor(
        environmentAccessKernel: IEnvironmentAccessKernel,
        pathResolverKernel: ISystemPathResolverKernel,
        coercerToolKernel: IConfigCoercerToolKernel,
        moduleDirContext: string
    ) {
        this.environmentAccessKernel = environmentAccessKernel;
        this.pathResolverKernel = pathResolverKernel;
        this.coercerToolKernel = coercerToolKernel;
        this.moduleDirContext = moduleDirContext; 
        
        this.#setupDependencies();
    }

    // --- Architectural Methods ---

    /**
     * Ensures all dependencies are valid and performs synchronous initialization checks.
     */
    #setupDependencies(): void {
        // Rigorous dependency validation
        if (!this.environmentAccessKernel || typeof this.environmentAccessKernel.getEnvironmentVariable !== 'function') {
            throw new Error('Dependency IEnvironmentAccessKernel is missing or invalid.');
        }
        if (!this.pathResolverKernel || typeof this.pathResolverKernel.calculateProjectRoot !== 'function') {
            throw new Error('Dependency ISystemPathResolverKernel is missing or invalid.');
        }
        if (!this.coercerToolKernel || typeof this.coercerToolKernel.coerce !== 'function') {
            throw new Error('Dependency IConfigCoercerToolKernel is missing or invalid.');
        }
    }

    // --- Private I/O Proxies ---

    #delegateToEnvironmentGet(key: string): string | undefined {
        // Isolates access to process.env
        return this.environmentAccessKernel.getEnvironmentVariable(key);
    }
    
    #delegateToPathResolverCalculateProjectRoot(): string {
        // Isolates path.resolve(__dirname, '../../') logic using the injected context
        return this.pathResolverKernel.calculateProjectRoot(this.moduleDirContext);
    }

    #delegateToPathResolverJoin(root: string, ...segments: string[]): string {
        // Isolates path.join calls
        return this.pathResolverKernel.joinPath(root, ...segments);
    }

    #delegateToCoercerCoerce(key: string, type: 'number' | 'enum' | 'string', defaultValue: any, validation?: Record<string, any>): any {
        // Isolates external coercion utility usage
        
        // Prepare source map using proxied environment access
        const source: Record<string, string | undefined> = {};
        source[key] = this.#delegateToEnvironmentGet(key);

        return this.coercerToolKernel.coerce({
            source: source, 
            key: key,
            defaultValue: defaultValue,
            type: type,
            validation: validation,
        });
    }

    // --- Initialization Logic ---

    /**
     * Initializes the configuration object by delegating path resolution, 
     * environment variable fetching, and coercion/validation.
     */
    private #loadConfiguration(): Configuration {
        // 1. Calculate project root (Delegated I/O)
        const SAFE_PROJECT_ROOT = this.#delegateToPathResolverCalculateProjectRoot();

        // 2. Coerce values (Delegated I/O)
        const serverPort = this.#delegateToCoercerCoerce(
            'PORT',
            'number',
            this.DEFAULT_CONFIG.SERVER_PORT,
            { min: 1 }
        ) as number;

        const nodeEnv = this.#delegateToCoercerCoerce(
            'NODE_ENV',
            'enum',
            this.DEFAULT_CONFIG.NODE_ENV,
            { valid_values: this.NODE_ENV_VALUES }
        ) as Configuration['NODE_ENV'];

        const logLevel = this.#delegateToCoercerCoerce(
            'LOG_LEVEL',
            'enum',
            this.DEFAULT_CONFIG.LOG_LEVEL,
            { valid_values: this.LOG_LEVEL_VALUES }
        ) as Configuration['LOG_LEVEL'];

        // 3. Construct final configuration object
        const effectiveConfig: Configuration = {
            NODE_ENV: nodeEnv,
            PROJECT_ROOT: SAFE_PROJECT_ROOT,
            SERVER_PORT: serverPort,
            LOG_LEVEL: logLevel,
            
            // System paths derived from the project root (Delegated I/O)
            EVENT_CONTRACT_PATH: this.#delegateToPathResolverJoin(SAFE_PROJECT_ROOT, 'config', 'TEDS_event_contract.json'),
        };

        return effectiveConfig;
    }

    /**
     * Retrieves a configuration setting. Configuration is lazy-loaded.
     */
    public get<K extends keyof Configuration>(key: K): Configuration[K] {
        if (!this.config) {
            this.config = this.#loadConfiguration();
        }
        
        return this.config[key];
    }
}