/*
 * FILE: utility/core/chr_verifier.js
 * SOVEREIGN AGI V94.1 CHR Verification Utility
 * 
 * Description: 
 * Enforces Configuration Integrity Check Requirement (C-ICR) by validating the hash registry 
 * against the live configuration files and verifying the CHR's self-integrity signature.
 * Utilizes streaming hash calculation for efficiency and canonical JSON for integrity determinism.
 */

const fsPromises = require('fs/promises');
const fs = require('fs'); // Required for streaming hash calculation
const crypto = require('crypto');
const path = require('path');

const CHR_PATH = path.join(__dirname, '../../protocol/chr_schema.json');
const CONFIG_ROOT = path.join(__dirname, '../../');

/**
 * Ensures deterministic hashing by stringifying objects with top-level sorted keys.
 * This is crucial for verifying self-integrity signatures across different environments.
 * @param {object} obj - The object to stringify.
 * @returns {string} Canonical JSON string.
 */
function canonicalStringify(obj) {
    // Ensure consistent key order for deterministic hashing
    const sortedKeys = Object.keys(obj).sort();
    
    const sortedObject = sortedKeys.reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
    }, {});

    return JSON.stringify(sortedObject);
}

/**
 * Calculates the hash of a file using streams for high memory efficiency.
 * @param {string} filePath - Absolute path to the file.
 * @param {string} algorithm - Hashing algorithm (e.g., SHA3-512).
 * @returns {Promise<string>} The calculated hash in hex format.
 */
async function calculateFileHash(filePath, algorithm) {
    const normAlgorithm = algorithm.replace(/-/g, '').toLowerCase();
    
    return new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(filePath);
        const hash = crypto.createHash(normAlgorithm);

        readStream.on('error', (err) => {
            // Pass errors (e.g., ENOENT - file not found) up to the caller
            reject(err);
        });

        // Pipe the file stream into the hash stream
        readStream.pipe(hash);

        hash.on('finish', () => {
            resolve(hash.digest('hex'));
        });
    });
}

/**
 * Verifies the integrity of the CHR against monitored configuration files.
 * @returns {Promise<{success: boolean, metrics: {total: number, failed: number, detailed_results: Array<Object>}}>}
 */
async function verifyConfigurationHashes() {
    console.log(`[CHR Core] Commencing C-ICR enforcement using protocol ${global.protocolVersion}...`);

    let chrContent;
    try {
        const rawChr = await fsPromises.readFile(CHR_PATH, 'utf8');
        chrContent = JSON.parse(rawChr);
    } catch (e) {
        console.error(`[CHR ERROR L5] Failed to load CHR file at ${CHR_PATH}. Checksum cannot proceed:`, e.message);
        return { success: false, metrics: { total: 0, failed: 1, detailed_results: [] } };
    }
    
    const results = [];
    let integrityFailed = false;
    let failedCount = 0;

    // 1. Verify CHR Self-Integrity (L5 CORE CRITICAL)
    const { integrity_signature, registry, ...chrVerificationPayload } = chrContent;
    
    if (!integrity_signature || !registry) {
         console.error(`[CHR L5 CORE_CRITICAL] CHR structure invalid (missing integrity_signature/registry).`);
         return { success: false, metrics: { total: 0, failed: 1, detailed_results: [] } };
    }
    
    const selfHashAlgorithm = integrity_signature.algorithm.replace(/-/g, '').toLowerCase();
    const expectedSelfSignature = integrity_signature.signature;
    
    // Use canonical stringification to ensure deterministic hashing of the payload
    const verificationPayloadString = canonicalStringify({ 
        registry, // Include registry explicitely as its order is critical
        ...chrVerificationPayload 
    });
        
    const calculatedSelfSignature = crypto.createHash(selfHashAlgorithm)
        .update(verificationPayloadString)
        .digest('hex');
        
    if (calculatedSelfSignature !== expectedSelfSignature) {
        console.error(`[CHR L5 CORE_CRITICAL] CHR File Integrity Failed: Tampering Suspected.`);
        console.error(`    Expected: ${expectedSelfSignature}`);
        integrityFailed = true; 
        failedCount++;
    } else {
        console.log('[CHR Success] Self-Integrity Verified (Signature Match).');
    }

    // 2. Verify all configuration entries
    for (const item of registry) {
        const absolutePath = path.join(CONFIG_ROOT, item.file_path);
        const { hash_value, algorithm } = item.integrity_metric;
        
        try {
            const calculatedHash = await calculateFileHash(absolutePath, algorithm);
            
            if (calculatedHash !== hash_value) {
                console.error(`[CHR MISMATCH | ${item.criticality_level}] File: ${item.file_path}`);
                console.error(`    Expected ${algorithm}: ${hash_value.substring(0, 12)}...`);
                integrityFailed = true; 
                failedCount++;
                results.push({ path: item.file_path, status: 'FAILED', level: item.criticality_level, reason: 'HASH_MISMATCH' });
            } else {
                results.push({ path: item.file_path, status: 'OK' });
            }
        } catch (e) {
            console.error(`[CHR FILE ERROR | ${item.criticality_level}] Could not read/hash config file: ${item.file_path}. Code: ${e.code}`);
            results.push({ path: item.file_path, status: 'MISSING', level: item.criticality_level, reason: e.code });
            integrityFailed = true;
            failedCount++;
        }
    }

    if (integrityFailed) {
        console.error(`\n--- [SYSTEM BREACH ALERT] Configuration Integrity Failure Detected. Total mismatches: ${failedCount}. Initiate L-9 Enforcement Procedures. ---`);
    } else {
        console.log('\n[C-ICR Verified] All monitored configurations match registry baseline.');
    }
    
    return { 
        success: !integrityFailed, 
        metrics: { 
            total: registry.length,
            failed: failedCount,
            detailed_results: results
        } 
    };
}

module.exports = { 
    verifyConfigurationHashes,
    calculateFileHash 
};