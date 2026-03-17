/**
 * @file IntegrityMonitor.js
 * @description Core utility for TEDS hash calculation and cross-stage artifact integrity validation.
 * Ensures standard SHA-256 application across all GSEP-C agents (CRoT, GAX, SGS).
 */

import { createHash } from 'crypto';

// --- AGI Kernel Plugin Interface Proxy ---
// Helper to invoke the extracted utility tool.
// NOTE: In the AGI-KERNEL runtime, this function is mapped to the compiled plugin execution.
function runCanonicalIntegrityHasher(data, createHashFn) {
  // Simulate access to the CanonicalIntegrityHasher tool
  const HashingTool = AGI_KERNEL.getPlugin('CanonicalIntegrityHasher');
  
  return HashingTool.execute({ data: data, createHashFn: createHashFn });
}
// ------------------------------------------

/**
 * Generates a standard SHA-256 hash for an input artifact or data structure using
 * the CanonicalIntegrityHasher tool, ensuring canonical serialization for objects.
 * 
 * @param {string|Buffer|object} data - The data payload to hash.
 * @returns {string} The SHA-256 hash in lowercase hex format.
 */
export function calculateArtifactHash(data) {
  // Delegation to the CanonicalIntegrityHasher plugin, passing 'createHash' as a required dependency.
  return runCanonicalIntegrityHasher(data, createHash);
}

/**
 * Validates if the recorded TEDS hash matches the provided artifact.
 * @param {string} recordedHash - The hash stored in the TEDS record.
 * @param {string|Buffer|object} artifact - The artifact data to re-check.
 * @returns {boolean} True if hashes match, false otherwise.
 */
export function validateTedsIntegrity(recordedHash, artifact) {
  // Hash calculation is assumed to produce the canonical (lowercase) form.
  const canonicalCalculatedHash = calculateArtifactHash(artifact);
  
  // Normalize the potentially mixed-case recorded hash for robust, case-insensitive comparison.
  const normalizedRecordedHash = recordedHash.toLowerCase();
  
  return normalizedRecordedHash === canonicalCalculatedHash;
}

/**
 * Compares two artifact hashes from different stages, ensuring case insensitivity.
 * @param {string} hashA 
 * @param {string} hashB 
 * @returns {boolean} True if hashes match.
 */
export function compareStageArtifacts(hashA, hashB) {
  // Normalize both hashes to the canonical (lowercase) standard before comparison
  // to guarantee cross-stage integrity check reliability.
  const canonicalA = hashA.toLowerCase();
  const canonicalB = hashB.toLowerCase();
  
  return canonicalA === canonicalB;
}