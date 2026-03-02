import { SchemaRegistryConfig } from './SchemaRegistry_Config.json';

interface ResolutionResult {
  registryPath: string;
  format: string;
}

/**
 * Autonomous Service for high-speed, prioritized schema path resolution 
 * based on telemetry stream prefixes and configurable regex rules.
 */
export class SchemaResolverService {
    private resolvers: typeof SchemaRegistryConfig.SchemaRegistry.stream_prefix_resolvers;

    constructor(config: typeof SchemaRegistryConfig) {
        // Load and sort resolvers by priority (descending)
        this.resolvers = config.SchemaRegistry.stream_prefix_resolvers
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Resolves the target registry path and serialization defaults for a given stream ID.
     * @param streamId The input telemetry stream identifier (e.g., S-101-DATA).
     */
    public resolve(streamId: string): ResolutionResult {
        const registryConfig = config.SchemaRegistry;
        
        for (const resolver of this.resolvers) {
            const regex = new RegExp(resolver.prefix_regex);
            if (regex.test(streamId)) {
                return {
                    registryPath: resolver.registry_path,
                    format: registryConfig.defaults.serialization_format,
                };
            }
        }

        // Fallback should not be hit if default catch-all resolver is present.
        throw new Error(`Schema path resolution failed for stream: ${streamId}`);
    }

    // Future utility methods for cache management or registry interaction go here...
}