import * as fs from 'fs';
import * as path from 'path';

// Defines the strict structure and types for the Global Intelligent Configuration Model
interface GICMConfig {
  version: string;
  metadata: {
    name: string;
    description: string;
  };
  environment: 'development' | 'testing' | 'production';
  runtime_optimization: {
    processing_mode: 'synchronous' | 'asynchronous';
    max_concurrent_tasks: number;
    caching_strategy: 'LRU' | 'FIFO' | 'NONE';
    telemetry_enabled: boolean;
  };
  modules: {
    code_evolution: {
      enabled: boolean;
      stability_threshold: number;
      auto_merge_strategy: 'aggressive' | 'conservative';
    };
    context_retrieval: {
        enabled: boolean;
        retrieval_depth: number;
        vector_similarity_metric: string;
    };
    threat_detection: {
      enabled: boolean;
      severity_level: 'low' | 'medium' | 'high';
    };
  };
}

const GICM_FILE_PATH = path.join(process.cwd(), 'assets/CRoT/GICM.json');

/**
 * Singleton loader responsible for retrieving, validating, and caching the GICM.
 * Ensures that the runtime uses a single, verified configuration instance.
 */
export class GICMLoader {
    private static instance: GICMLoader;
    private config: GICMConfig | null = null;

    private constructor() {}

    public static getInstance(): GICMLoader {
        if (!GICMLoader.instance) {
            GICMLoader.instance = new GICMLoader();
        }
        return GICMLoader.instance;
    }

    private validate(data: any): GICMConfig {
        // Basic structural checks for high-level safety and required fields
        if (!data || !data.version || !data.modules || !data.runtime_optimization) {
            throw new Error("GICM Validation Error: Missing core architectural segments (version, modules, or runtime_optimization).");
        }
        // NOTE: In a production AGI environment, schema validation (e.g., Joi, Zod) would be integrated here.
        return data as GICMConfig;
    }

    public load(): GICMConfig {
        if (this.config) {
            return this.config;
        }

        try {
            const fileContent = fs.readFileSync(GICM_FILE_PATH, 'utf8');
            const rawData = JSON.parse(fileContent);
            
            this.config = this.validate(rawData);
            
            console.log(`[GICM] v${this.config.version} loaded successfully. Environment: ${this.config.environment}.`);
            return this.config;
        } catch (error) {
            console.error("CRoT Initialization FAILED: Could not load GICM.", error);
            throw new Error(`CRITICAL SYSTEM FAILURE: Failed to initialize GICM configuration.`);
        }
    }
    
    public getConfiguration(): GICMConfig {
        if (!this.config) {
            return this.load(); 
        }
        return this.config;
    }
}