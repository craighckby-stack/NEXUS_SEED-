/**
 * SCR_IntegrityValidator v94.1 (Refactored)
 * Autonomous system component for enforcing structural integrity policies.
 *
 * Reads SCR_IntegrityManifest.json, computes real-time file hashes
 * concurrently, and delegates enforcement to the Failure Mode Executor.
 */

const { promises: fs } = require('fs');
const path = require('path');
const crypto = require('crypto');
// Integration point for handling breach policy execution
const FailureModeExecutor = require('./SCR_FailureModeExecutor'); 

const MANIFEST_PATH = path.join(__dirname, 'SCR_IntegrityManifest.json');
const HASH_ALGORITHM = 'sha512';

/**
 * Calculates the SHA-512 hash for a given file path using streams for efficiency.
 * @param {string} filePath 
 * @returns {Promise<string>} Hex encoded hash.
 */
function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        // Must use the standard require('fs') for createReadStream
        const readStream = require('fs').createReadStream(filePath); 
        const hash = crypto.createHash(HASH_ALGORITHM);
        
        readStream.on('data', chunk => hash.update(chunk));
        readStream.on('end', () => resolve(hash.digest('hex')));
        readStream.on('error', err => {
            // Include file path in error for better debugging
            reject(new Error(`Failed to hash ${filePath}: ${err.message}`));
        });
    });
}

/**
 * Loads and parses the Integrity Manifest.
 * @returns {Promise<Object>} The manifest data.
 */
async function loadManifest() {
    try {
        const data = await fs.readFile(MANIFEST_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        if (e.code === 'ENOENT') {
            throw new Error('CRITICAL: Integrity Manifest not found.');
        }
        // Handle parsing errors or read errors gracefully
        throw new Error(`CRITICAL: Failed to load or parse manifest: ${e.message}`);
    }
}

/**
 * Processes integrity breaches identified during validation and executes policies.
 * @param {Array<Object>} breaches - List of detected integrity compromises.
 */
async function handleBreaches(breaches) {
    if (breaches.length === 0) {
        console.log('VALIDATION SUCCESS: System integrity confirmed.');
        return true;
    }

    console.error(`VALIDATION FAILED: ${breaches.length} critical files compromised.`);

    for (const breach of breaches) {
        console.warn(`[BREACH] File: ${breach.path}. Mode: ${breach.failure_mode}`);
        console.warn(` -> Expected: ${breach.expectedHash.substring(0, 16)}...`);
        console.warn(` -> Actual:   ${breach.actualHash.substring(0, 16)}...`);
        
        // Delegate enforcement logic to the Executor
        await FailureModeExecutor.execute(breach.failure_mode, breach.path, breach.details);
    }
    
    // Validation status is false if any breaches occurred.
    return false;
}

/**
 * Executes concurrent integrity validation against the manifest.
 * @returns {Promise<boolean>} True if validation succeeded, false otherwise.
 */
async function validateIntegrity() {
    let manifest;
    try {
        manifest = await loadManifest();
    } catch (e) {
        console.error(e.message);
        return false;
    }

    console.log(`[Integrity Check] Starting validation using Manifest ID: ${manifest.manifest_id}`);

    const hashPromises = [];
    const filesMap = new Map(); // Store file metadata keyed by index for later correlation

    // 1. Queue all file hash calculations concurrently
    Object.entries(manifest.integrity_groups).forEach(([groupName, group]) => {
        group.files.forEach((fileEntry, index) => {
            const fileKey = `${groupName}:${index}`;
            filesMap.set(fileKey, { ...fileEntry, groupName, priority: group.priority });
            
            // Push the async task to the promises array
            hashPromises.push(
                calculateFileHash(fileEntry.path)
                    .then(currentHash => ({ 
                        fileKey, 
                        status: 'success', 
                        hash: currentHash 
                    }))
                    .catch(error => ({ 
                        fileKey, 
                        status: 'error', 
                        message: error.message 
                    }))
            );
        });
    });

    // 2. Wait for all hash calculations to complete in parallel
    const results = await Promise.all(hashPromises);

    // 3. Analyze results and identify breaches
    const breaches = [];

    results.forEach(result => {
        const fileMetadata = filesMap.get(result.fileKey);

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

        if (result.hash !== fileMetadata.hash_sha512) {
            // Hash Mismatch detected
            breaches.push({
                path: fileMetadata.path,
                failure_mode: fileMetadata.failure_mode,
                expectedHash: fileMetadata.hash_sha512,
                actualHash: result.hash,
                details: { 
                    priority: fileMetadata.priority, 
                    type: 'HASH_MISMATCH' 
                }
            });
        }
    });

    // 4. Handle all collected breaches
    return await handleBreaches(breaches);
}

module.exports = { validateIntegrity, calculateFileHash };
