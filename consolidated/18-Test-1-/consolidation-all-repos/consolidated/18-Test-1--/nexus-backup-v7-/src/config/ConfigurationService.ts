import path from 'path';

// --- Type Definition for Configuration Structure ---
export interface Configuration {
  NODE_ENV: 'development' | 'production' | 'test';
  PROJECT_ROOT: string;
  SERVER_PORT: number;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // Specific System Paths
  EVENT_CONTRACT_PATH: string;
  // Add more structured configuration fields here...
}

const DEFAULT_CONFIG: Partial<Configuration> = {
    NODE_ENV: 'development',
    SERVER_PORT: 3000,
    LOG_LEVEL: 'info',
};

// --- Configuration Service Implementation ---

/**
 * ConfigurationService provides centralized, strongly-typed access to 
 * system configurations, prioritizing environment variables over predefined defaults.
 * It employs a static lazy-loading strategy (Singleton pattern).
 */
export class ConfigurationService {
    private static config: Configuration | null = null;

    /**
     * Initializes the configuration object by calculating project paths
     * and merging environment variables with predefined defaults.
     * @returns The fully constructed Configuration object.
     */
    private static initialize(): Configuration {
        // Determine PROJECT_ROOT: resolves two directories up from the service file location (src/config -> src -> ROOT).
        const SAFE_PROJECT_ROOT = path.resolve(__dirname, '../../');


        const effectiveConfig: Configuration = {
            // Environment variables override defaults
            NODE_ENV: (process.env.NODE_ENV as Configuration['NODE_ENV']) || DEFAULT_CONFIG.NODE_ENV!,
            PROJECT_ROOT: SAFE_PROJECT_ROOT,
            // Robustly parse environment variables for numerical values, falling back to defaults
            SERVER_PORT: parseInt(process.env.PORT || String(DEFAULT_CONFIG.SERVER_PORT), 10),
            LOG_LEVEL: (process.env.LOG_LEVEL as Configuration['LOG_LEVEL']) || DEFAULT_CONFIG.LOG_LEVEL!,
            
            // System paths derived from the project root
            EVENT_CONTRACT_PATH: path.join(SAFE_PROJECT_ROOT, 'config', 'TEDS_event_contract.json'),
        };

        // Basic validation for critical numbers
        if (isNaN(effectiveConfig.SERVER_PORT) || effectiveConfig.SERVER_PORT <= 0) {
            console.warn(`[Config] Invalid SERVER_PORT detected (${process.env.PORT}). Using default: ${DEFAULT_CONFIG.SERVER_PORT}`);
            effectiveConfig.SERVER_PORT = DEFAULT_CONFIG.SERVER_PORT!;
        }

        return effectiveConfig;
    }

    /**
     * Retrieves a configuration setting.
     * Configuration is loaded only upon the first request (lazy initialization).
     * @param key The configuration key.
     */
    public static get<K extends keyof Configuration>(key: K): Configuration[K] {
        if (!ConfigurationService.config) {
            ConfigurationService.config = ConfigurationService.initialize();
        }
        
        // The initialization guarantees all keys are present, eliminating the need for runtime key existence checks inside 'get'.
        return ConfigurationService.config[key];
    }

    /**
     * Optionally export the Configuration type for consumers to use when strong typing is needed.
     */
    // public static getConfig(): Configuration { return ConfigurationService.config || ConfigurationService.initialize(); }
}
