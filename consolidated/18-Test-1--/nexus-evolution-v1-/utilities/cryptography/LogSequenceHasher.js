/**
 * Component: LogSequenceHasher (LSH)
 * Role: Ensures the immutability and verifiable ordering of the Governance Decision Log.
 * 
 * The LSH takes the raw 'decision_log' array, serializes it canonically (consistent key ordering, no whitespace),
 * and computes a SHA-256 hash (LCH_hash) which is then embedded in the GICM.
 */

import { canonicalizeJson } from '../serialization/canonicalizer';
import { generateSha256Hash } from './hasher';

export class LogSequenceHasher {
    /**
     * Generates the LCH hash for a decision log.
     * @param {Array<object>} decisionLog - The ordered array of stage results.
     * @returns {string} The SHA-256 hash of the canonically serialized log.
     */
    static generateLogChainHash(decisionLog) {
        if (!Array.isArray(decisionLog) || decisionLog.length === 0) {
            throw new Error('Decision log cannot be empty or invalid.');
        }

        // 1. Canonicalize the JSON array for deterministic serialization.
        // This ensures the hash is identical regardless of runtime serialization quirks.
        const canonicalString = canonicalizeJson(decisionLog);

        // 2. Generate the SHA-256 hash.
        return generateSha256Hash(canonicalString);
    }
}