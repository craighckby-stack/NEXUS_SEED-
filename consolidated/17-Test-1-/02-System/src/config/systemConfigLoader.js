import * as fs from 'fs';
import * as path from 'path';
import { SecureConfigProvider } from '../utils/secureConfigProvider.js';

/**
 * Responsible for loading, decrypting, and providing the finalized application configuration.
 * Assumes encrypted secrets are stored in a designated configuration file structure.
 */
export class SystemConfigLoader {

    static CONFIG_FILE_PATH = path.resolve(process.cwd(), 'config', 'runtime.encrypted.json');

    /**
     * Loads and decrypts the primary configuration file.
     * @returns {Object} The fully configured and decrypted system configuration object.
     */
    static async loadConfig() {
        if (!fs.existsSync(SystemConfigLoader.CONFIG_FILE_PATH)) {
            throw new Error(`FATAL: Configuration file not found at ${SystemConfigLoader.CONFIG_FILE_PATH}`);
        }
        
        const rawConfig = JSON.parse(fs.readFileSync(SystemConfigLoader.CONFIG_FILE_PATH, 'utf-8'));
        const config = {};

        // Iteratively process raw configuration fields
        for (const [key, value] of Object.entries(rawConfig)) {
            // Assumption: Any field that follows a convention (e.g., suffix '_ENCRYPTED') 
            // or is determined to be a secret placeholder should be decrypted.
            
            // Simple decryption logic: If the value is a string and not obviously plain JSON, attempt decryption.
            // A more complex implementation would use metadata or dedicated 'secrets' object.
            
            if (typeof value === 'string' && value.includes(':')) {
                // SecureConfigProvider handles decryption and automatic JSON parsing if content is JSON
                try {
                    config[key] = SecureConfigProvider.getSecret(value);
                } catch (e) {
                    console.error(`Error decrypting configuration field: ${key}`);
                    throw e; // Halt initialization on critical config failure
                }
            } else {
                // Non-secret or pre-parsed value
                config[key] = value;
            }
        }

        console.log('System configuration loaded and secrets successfully decrypted.');
        return Object.freeze(config);
    }
}