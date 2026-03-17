/**
 * @file IntegrityMonitor.js
 * @description Core utility for TEDS hash calculation and cross-stage artifact integrity validation.
 * Ensures standard SHA-256 application across all GSEP-C agents (CRoT, GAX, SGS).
 */

import { createHash } from 'crypto';

/**
 * Generates a standard SHA-256 hash for an input artifact or data structure.
 * @param {string|Buffer|object} data - The data payload to hash.
 * @returns {string} The SHA-256 hash in lowercase hex format.
 */
export function calculateArtifactHash(data) {
  const hasher = createHash('sha256');
  let input;

  if (typeof data === 'object' && data !== null && !Buffer.isBuffer(data)) {
    // Ensure consistent hashing for objects (canonical JSON serialization)
    input = JSON.stringify(data, Object.keys(data).sort());
  } else {
    input = data;
  }

  hasher.update(input);
  return hasher.digest('hex');
}

/**
 * Validates if the recorded TEDS hash matches the provided artifact.
 * @param {string} recordedHash - The hash stored in the TEDS record.
 * @param {string|Buffer|object} artifact - The artifact data to re-check.
 * @returns {boolean} True if hashes match, false otherwise.
 */
export function validateTedsIntegrity(recordedHash, artifact) {
  const calculatedHash = calculateArtifactHash(artifact);
  return recordedHash.toLowerCase() === calculatedHash;
}

// Placeholder export for cross-stage comparison logic (S03 Input vs S05 Output)
export function compareStageArtifacts(hashA, hashB) {
  return hashA.toLowerCase() === hashB.toLowerCase();
}
