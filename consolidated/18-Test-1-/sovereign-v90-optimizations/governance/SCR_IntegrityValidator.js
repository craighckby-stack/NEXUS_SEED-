/**
 * SCR_IntegrityValidator v94.2 (Refactored)
 * Autonomous system component for enforcing structural integrity policies.
 *
 * Reads SCR_IntegrityManifest.json, computes real-time file hashes
 * concurrently, and delegates enforcement to the Failure Mode Executor.
 */

import { promises as fs } from 'fs'; 
import path from 'path';

// Assume AGI_PLUGINS access for integration
// declare const AGI_PLUGINS: {
//     FileIntegrityHasher: {
//         calculateHash: (args: { filePath: string, algorithm: string }) => Promise<string>;
//     }
// };

// --- Manifest Data Structures ---

interface ManifestFileEntry {
    path: string;
    hash_sha512: string; // The expected hash
    failure_mode: string; // Policy identifier for the executor
}

interface IntegrityGroup {
    priority: number;
    files: ManifestFileEntry[];
}

interface IntegrityManifest {
    manifest_id: string;
    integrity_groups: {
        [groupName: string]: IntegrityGroup;
    };
}

interface Breach {
    path: string;
    failure_mode: string;
    expectedHash: string;
    actualHash: string;
    details: any;
}

/**
 * SCR_IntegrityValidator
 * Encapsulated class for managing integrity validation flow.
 */
class SCR_IntegrityValidator {
    #fs;
    #path;
    #manifestPath;
    #hashAlgorithm;
    #FailureModeExecutor;
    #FileIntegrityHasher;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Goal: Synchronous setup extraction.
     * Resolves all external dependencies, plugins, and constants.
     */
    #setupDependencies() {
        // 1. Resolve Standard Environment Tooling
        this.#fs = fs;
        this.#path = path;
        this.#hashAlgorithm = 'sha512';
        
        // 2. Resolve Constants using proxy for path operation
        this.#manifestPath = this.#delegateToPathJoin(__dirname, 'SCR_IntegrityManifest.json');
        
        // 3. Resolve Local Dependency (synchronous require)
        this.#FailureModeExecutor = require('./SCR_FailureModeExecutor'); 
        
        // 4. Resolve Plugin Dependency (AGI_PLUGINS is assumed globally available)
        // @ts-ignore: AGI_PLUGINS is injected by the runtime environment
        if (typeof AGI_PLUGINS === 'undefined' || !AGI_PLUGINS.FileIntegrityHasher) {
            throw new Error("CRITICAL Dependency Failure: FileIntegrityHasher plugin not available.");
        }
        // @ts-ignore
        this.#FileIntegrityHasher = AGI_PLUGINS.FileIntegrityHasher;
    }

    // --- I/O Proxy Functions ---

    #logInfo(message: string) {
        console.log(message);
    }

    #logError(message: string) {
        console.error(message);
    }

    #logWarning(message: string) {
        console.warn(message);
    }

    #delegateToPathJoin(...args: string[]): string {
        return this.#path.join(...args);
    }

    /** Delegates file system read and JSON parsing for the manifest. */
    async #delegateToFSRuntimeLoadManifest(): Promise<IntegrityManifest> {
        try {
            const data = await this.#fs.readFile(this.#manifestPath, 'utf8');
            return JSON.parse(data) as IntegrityManifest;
        } catch (e) {
            const error = e as NodeJS.ErrnoException;
            if (error.code === 'ENOENT') {
                throw new Error('CRITICAL: Integrity Manifest not found.');
            }
            throw new Error(`CRITICAL: Failed to load or parse manifest: ${error.message}`);
        }
    }

    /** Delegates hash calculation to the external FileIntegrityHasher plugin. */
    async #delegateToFileHashCalculation(filePath: string): Promise<string> {
        return this.#FileIntegrityHasher.calculateHash({
            filePath: filePath, 
            algorithm: this.#hashAlgorithm 
        });
    }

    /** Delegates policy enforcement to the FailureModeExecutor. */
    async #delegateToFailureModeExecution(mode: string, path: string, details: any): Promise<void> {
        // FailureModeExecutor is implicitly 'require'd earlier
        await this.#FailureModeExecutor.execute(mode, path, details);
    }

    // --- Internal Logic Methods ---

    /** Loads and parses the Integrity Manifest using I/O proxies. */
    async #loadManifest(): Promise<IntegrityManifest> {
        return this.#delegateToFSRuntimeLoadManifest();
    }

    /** Processes integrity breaches identified during validation and executes policies. */
    async #handleBreaches(breaches: Breach[]): Promise<boolean> {
        if (breaches.length === 0) {
            this.#logInfo('VALIDATION SUCCESS: System integrity confirmed.');
            return true;
        }

        this.#logError(`VALIDATION FAILED: ${breaches.length} critical files compromised.`);

        for (const breach of breaches) {
            this.#logWarning(`[BREACH] File: ${breach.path}. Mode: ${breach.failure_mode}`);
            this.#logWarning(` -> Expected: ${breach.expectedHash.substring(0, 16)}...`);
            this.#logWarning(` -> Actual:   ${breach.actualHash.substring(0, 16)}...`);
            
            // Delegate enforcement logic to the Executor
            await this.#delegateToFailureModeExecution(breach.failure_mode, breach.path, breach.details);
        }
        
        // Validation status is false if any breaches occurred.
        return false;
    }

    /** 
     * Executes concurrent integrity validation against the manifest.
     * @returns {Promise<boolean>} True if validation succeeded, false otherwise.
     */
    async executeValidation(): Promise<boolean> {
        // 1. Load Manifest
        let manifest: IntegrityManifest;
        try {
            manifest = await this.#loadManifest();
        } catch (e) {
            this.#logError((e as Error).message);
            return false;
        }

        this.#logInfo(`[Integrity Check] Starting validation using Manifest ID: ${manifest.manifest_id}`);

        type HashResult = { fileKey: string; status: 'success' | 'error'; hash?: string; message?: string; };
        type FileMetadata = ManifestFileEntry & { groupName: string, priority: number };

        const hashPromises: Promise<HashResult>[] = [];
        const filesMap = new Map<string, FileMetadata>(); 

        // 2. Queue all file hash calculations concurrently
        Object.entries(manifest.integrity_groups).forEach(([groupName, group]) => {
            group.files.forEach((fileEntry, index) => {
                const fileKey = `${groupName}:${index}`;
                
                filesMap.set(fileKey, { 
                    ...fileEntry, 
                    groupName,
                    priority: group.priority 
                });
                
                // Use proxied hashing service
                hashPromises.push(
                    this.#delegateToFileHashCalculation(fileEntry.path)
                    .then(currentHash => ({
                        fileKey, 
                        status: 'success',
                        hash: currentHash 
                    }))
                    .catch(error => ({
                        fileKey, 
                        status: 'error', 
                        message: (error as Error).message 
                    }))
                );
            });
        });

        // 3. Wait for all hash calculations to complete in parallel
        const results = await Promise.all(hashPromises);

        // 4. Analyze results and identify breaches
        const breaches: Breach[] = [];

        results.forEach(result => {
            const fileMetadata = filesMap.get(result.fileKey);

            if (!fileMetadata) return; // Should not happen

            if (result.status === 'error') {
                // File inaccessible or hashing failed
                breaches.push({
                    path: fileMetadata.path,
                    failure_mode: fileMetadata.failure_mode,
                    expectedHash: fileMetadata.hash_sha512,
                    actualHash: 'N/A (Read Error)',
                    details: { error: result.message, type: 'FILE_ACCESS' }
                });
                return;
            }

            // Type cast assertion needed here since `result.hash` exists only if status is 'success'
            const actualHash = result.hash!;
            
            if (actualHash !== fileMetadata.hash_sha512) {
                // Hash Mismatch detected
                breaches.push({
                    path: fileMetadata.path,
                    failure_mode: fileMetadata.failure_mode,
                    expectedHash: fileMetadata.hash_sha512,
                    actualHash: actualHash,
                    details: { 
                        priority: fileMetadata.priority, 
                        type: 'HASH_MISMATCH' 
                    }
                });
            }
        });

        // 5. Handle all collected breaches
        return await this.#handleBreaches(breaches);
    }
}

// Instantiate a private singleton for external access
const validatorInstance = new SCR_IntegrityValidator();

// Export the original API via a wrapper method
module.exports = { 
    validateIntegrity: () => validatorInstance.executeValidation() 
};
