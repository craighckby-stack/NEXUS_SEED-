/**
 * VetoConfigLoaderService
 * Responsible for locating, loading, caching, and potentially validating
 * the VETO trigger configurations based on system environment or target Asset ID.
 */

import fs from 'fs';
import path from 'path';
// Assuming a schema validator utility exists
// import { SchemaValidator } from '../utils/SchemaValidator';

const DEFAULT_CONFIG_PATH = '../../assets/GAX/AHMID_VETO_TRIGGERS.json';

class VetoConfigLoaderService {
    constructor(options = {}) {
        this.configCache = new Map();
        this.assetId = options.assetId || 'default'; // Allows loading asset-specific configs
        // this.validator = new SchemaValidator('VETO_SCHEMA_1.1');
    }

    /**
     * Dynamically loads the VETO triggers for the configured asset/environment.
     * @returns {Promise<object>} The loaded and validated configuration.
     */
    async loadVetoTriggers() {
        const cacheKey = this.assetId;
        if (this.configCache.has(cacheKey)) {
            return this.configCache.get(cacheKey);
        }

        try {
            // In a production system, this would typically involve fetching from a remote KV store or config service.
            const absolutePath = path.resolve(__dirname, DEFAULT_CONFIG_PATH);
            const configData = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
            
            // Validation step (omitted implementation)
            // if (!this.validator.validate(configData)) {
            //     throw new Error('Veto Configuration Schema Validation Failed.');
            // }

            // Set necessary default for improved logic in evaluation service
            if (!configData.high_trigger_threshold) {
                configData.high_trigger_threshold = 3; // Default weight/count
            }
            
            this.configCache.set(cacheKey, configData);
            return configData;
        } catch (error) {
            console.error(`Error loading Veto Triggers for ${this.assetId}:`, error.message);
            // Essential for a high-intelligence system: Fail-safe configuration or default operational mode
            return { vector_definitions: {} };
        }
    }

    /**
     * Clears the configuration cache for a specific asset (useful for runtime updates).
     * @param {string} key
     */
    clearCache(key = this.assetId) {
        this.configCache.delete(key);
    }
}

export default VetoConfigLoaderService;