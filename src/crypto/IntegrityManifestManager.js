const fs = require('fs/promises');
const IntegrityHashUtility = require('./IntegrityHashUtility');
const IntegrityManifestError = require('./IntegrityManifestError');

/**
 * IntegrityManifestManager
 * Manages the creation, loading, and comprehensive validation of system integrity manifests.
 * A manifest (e.g., integrity.json) maps relative file paths to their expected cryptographic hashes (SHA-256 assumed).
 * 
 * NOTE: Hashing and validation operations are performed concurrently for maximum efficiency.
 */
class IntegrityManifestManager {
    
    /**
     * Generates a manifest for a list of file paths.
     * All provided paths should be relative to a known root if the manifest is intended for portability.
     * Processes files concurrently using Promise.all.
     * 
     * @param {string[]} filePaths Array of relative file paths.
     * @returns {Promise<Record<string, string>>} A map of relativePath -> hash.
     * @throws {IntegrityManifestError} If any file fails to hash.
     */
    static async generateManifest(filePaths) {
        const hashPromises = filePaths.map(async (filePath) => {
            try {
                // Assuming IntegrityHashUtility handles file reading robustly
                const hash = await IntegrityHashUtility.hashFileAsync(filePath);
                return { filePath, hash };
            } catch (error) {
                // Capture the error object for centralized handling later
                return { filePath, error: error };
            }
        });

        const results = await Promise.all(hashPromises);
        const manifest = {};
        const errors = [];

        for (const result of results) {
            if (result.error) {
                // Use a standard error message format for aggregation
                errors.push(`${result.filePath}: Failed to hash file: ${result.error.message || result.error}`);
            } else {
                // Ensure paths are stored as received (should be relative for portability)
                manifest[result.filePath] = result.hash;
            }
        }

        if (errors.length > 0) {
            throw new IntegrityManifestError(
                `Manifest generation failed for ${errors.length} file(s).`,
                errors,
                'GENERATION'
            );
        }

        return manifest;
    }
    
    /**
     * Saves the manifest object to a JSON file.
     * @param {string} manifestPath Path where the manifest should be saved.
     * @param {Record<string, string>} manifest The manifest object (relativePath -> hash).
     */
    static async saveManifest(manifestPath, manifest) {
        const jsonContent = JSON.stringify(manifest, null, 2);
        await fs.writeFile(manifestPath, jsonContent, 'utf8');
    }

    /**
     * Loads and validates a stored manifest against the current filesystem.
     * Validation is performed concurrently.
     * 
     * @param {string} manifestPath Path to the stored manifest file.
     * @returns {Promise<{valid: boolean, errors: string[]}>} Detailed validation result.
     * @throws {IntegrityManifestError} If the manifest file cannot be loaded or parsed.
     */
    static async validateManifest(manifestPath) {
        let expectedManifest;
        
        try {
            const data = await fs.readFile(manifestPath, 'utf8');
            // Manifest structure is { filePath: hashString }
            expectedManifest = JSON.parse(data);
        } catch (e) {
            throw new IntegrityManifestError(
                `Failed to load or parse manifest file ${manifestPath}.`,
                [e.message],
                'LOAD'
            );
        }

        const validationPromises = Object.entries(expectedManifest).map(async ([filePath, expectedHash]) => {
            try {
                // 1. Calculate hash of the existing file
                const calculatedHash = await IntegrityHashUtility.hashFileAsync(filePath);
                
                // 2. Direct string comparison (simplified: removed redundant utility call)
                if (calculatedHash !== expectedHash) {
                    // Provide truncated hashes for concise error logs
                    const truncatedExpected = expectedHash.substring(0, 10);
                    const truncatedCalculated = calculatedHash.substring(0, 10);
                    return `Integrity mismatch for ${filePath}. Expected: ${truncatedExpected}..., Got: ${truncatedCalculated}...`;
                }
            } catch (e) {
                // Handle cases where file is deleted, permissions error, or read error
                return `Validation failure (file access/hashing) for ${filePath}: ${e.message}`;
            }
            return null; // Indicates successful validation for this file
        });

        const validationResults = await Promise.all(validationPromises);
        
        const errors = validationResults.filter(result => result !== null);
        
        return { valid: errors.length === 0, errors };
    }
}

module.exports = IntegrityManifestManager;
