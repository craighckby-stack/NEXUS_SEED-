/**
 * CoreHashEngine.ts
 * Provides canonical JSON serialization and SHA-256 hashing for GSC proposals.
 * This utility is critical for generating reproducible 'integrity_checksum' values.
 */

import { createHash } from 'crypto';

// Defines fields that must be excluded or reset before hashing the proposal itself.
const EXCLUDED_FIELDS = ['integrity_checksum', 'signatures', 'verification_data'];

/**
 * Canonicalizes the JSON object for deterministic hashing (required for consensus).
 * Standard method: Lexicographically sorted keys, no whitespace.
 * @param obj The proposal object.
 * @returns Canonicalized JSON string.
 */
function canonicalize(obj: object): string {
    // Note: A robust implementation would use a dependency like 'fast-json-stable-stringify'
    // For scaffolding, we simulate the required structure.
    
    // Deep clone and clean object first
    const workingObject = JSON.parse(JSON.stringify(obj));

    EXCLUDED_FIELDS.forEach(field => {
        delete workingObject[field];
    });
    
    // Use standard sort-key stringify for canonical output
    // Implementation must guarantee byte-for-byte reproducibility across runtime environments.
    return JSON.stringify(workingObject, Object.keys(workingObject).sort());
}

/**
 * Calculates the integrity checksum for a given GSC proposal.
 * @param proposal The raw GSC proposal object.
 * @returns The SHA-256 integrity hash string.
 */
export function calculateProposalChecksum(proposal: object): string {
    const canonicalData = canonicalize(proposal);
    return createHash('sha256').update(canonicalData, 'utf8').digest('hex');
}
