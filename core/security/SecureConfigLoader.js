/**
 * core/security/SecureConfigLoader.js
 *
 * Component responsible for securely loading and verifying critical system
 * configuration files, ensuring integrity and immutability during runtime.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { SystemLogger } from '../system/SystemLogger';

const LOADER_SOURCE = 'SECURE_CONFIG_LOADER';
const logger = new SystemLogger(LOADER_SOURCE);

export class SecureConfigLoader {

    /**
     * Loads a critical configuration file and performs a simple hash integrity check.
     * NOTE: In production AGI systems, this would be extended to use cryptographic signatures
     * attested during deployment.
     *
     * @param {string} filePath - Absolute path to the configuration file (e.g., JSON).
     * @param {string | null} [expectedHash=null] - Optional SHA256 hash to verify file integrity.
     * @returns {object} Parsed configuration object.
     */
    static load(filePath, expectedHash = null) {
        logger.info(`Attempting to securely load config: ${filePath}`);

        let fileContent;
        try {
            // Use sync read for security bootstrapping to guarantee file state.
            fileContent = fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            logger.critical(`SECURITY FAILURE: Cannot read critical config file at ${filePath}.`, { error: error.message });
            // Immediate halt required if a critical config file cannot be accessed.
            throw new Error(`[SecureConfigLoader] HALT: File read failure for ${path.basename(filePath)}.`);
        }

        const currentHash = crypto.createHash('sha256').update(fileContent).digest('hex');

        if (expectedHash && currentHash !== expectedHash) {
            logger.critical(`SECURITY BREACH DETECTED: Config integrity failure for ${path.basename(filePath)}.`, {
                expected: expectedHash,
                current: currentHash
            });
            // Immediate halt required if config integrity is compromised.
            throw new Error(`[SecureConfigLoader] HALT: Integrity check failed for ${path.basename(filePath)}.`);
        }

        try {
            // Attempt to parse JSON content
            return JSON.parse(fileContent);
        } catch (error) {
            logger.critical(`CONFIGURATION ERROR: Failed to parse JSON content in ${filePath}.`, { error: error.message });
            throw new Error(`[SecureConfigLoader] HALT: JSON parsing failed for ${path.basename(filePath)}.`);
        }
    }

    /**
     * Calculates the hash of a given file content string.
     * @param {string} content - The content to hash.
     * @returns {string} SHA256 hash string.
     */
    static getHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}