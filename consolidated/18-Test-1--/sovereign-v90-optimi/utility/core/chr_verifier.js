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
const crypto = require('crypto');
const path = require('path');

// AGI Kernel Interface for Plugins (assuming access to AGI_PLUGINS)
const DeterministicHasher = AGI_PLUGINS.DeterministicHasher;

const CHR_PATH = path.join(__dirname, '../../protocol/chr_schema.json');
const CONFIG_ROOT = path.join(__dirname, '../../');

/**
 * Calculates the hash of raw data using a specified algorithm.
 * This helper is used specifically for the CHR self-integrity check (non-streaming data).
 * @param {string} data - The raw string data.
 * @param {string} algorithm - Hashing algorithm.
 * @returns {string} The calculated hash in hex format.
 */
function calculateDataHash(data, algorithm) {
    const normAlgorithm = algorithm.replace(/-/g, '').toLowerCase();
    return crypto.createHash(normAlgorithm)
        .update(data)
        .digest('hex');
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

    const selfHashAlgorithm = integrity_signature.algorithm;
    const expectedSelfSignature = integrity_signature.signature;

    // Use Canonical Stringify Plugin for deterministic hashing of the payload
    const verificationPayloadString = DeterministicHasher.execute('canonicalStringify', {
        obj: {
            registry,
            ...chrVerificationPayload
        }
    });

    const calculatedSelfSignature = calculateDataHash(verificationPayloadString, selfHashAlgorithm);

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
            // Use Streaming Hash Plugin
            const calculatedHash = await DeterministicHasher.execute('calculateFileHash', {
                filePath: absolutePath,
                algorithm: algorithm
            });

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
            const reason = e.code || 'UNKNOWN_IO_ERROR';
            console.error(`[CHR FILE ERROR | ${item.criticality_level}] Could not read/hash config file: ${item.file_path}. Code: ${reason}`);
            results.push({ path: item.file_path, status: 'MISSING', level: item.criticality_level, reason: reason });
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
    // Wrapper to maintain exported interface for streaming hash calculation
    calculateFileHash: (filePath, algorithm) => DeterministicHasher.execute('calculateFileHash', { filePath, algorithm })
};
