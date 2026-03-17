// core/utils/CoreCryptographicVerifier.js

import { createHash } from 'crypto';

/**
 * CoreCryptographicVerifier
 * Utility class for advanced state integrity verification (Merkle Proofs, HMACs).
 * This is crucial for systems relying on root hashes (like SCL), as verification 
 * should prove inclusion cryptographically, not just rely on DB consistency.
 */
export class CoreCryptographicVerifier {

    /**
     * Standardized SHA-256 Hashing for internal primitives.
     * @param {string|Buffer} data
     * @returns {string} Hex encoded hash
     */
    static hash(data) {
        return createHash('sha256').update(data).digest('hex');
    }

    /**
     * Verifies a Merkle Proof against a known Merkle Root.
     * NOTE: This is a foundational utility. Actual implementation depends on
     * the exact Merkle tree structure used by the persistence layer (e.g., SCL).
     *
     * @param {string} rootHash - The expected Merkle Root Hash.
     * @param {string} leafData - The data whose inclusion needs to be proven.
     * @param {Array<{hash: string, position: 'left' | 'right'}>} proofPath - Array of proof nodes.
     * @returns {boolean} True if the proof verifies.
     */
    static verifyMerkleProof(rootHash, leafData, proofPath) {
        if (!proofPath || proofPath.length === 0) {
            // Edge case: Root is the hash of the leaf itself
            return rootHash === CoreCryptographicVerifier.hash(leafData);
        }

        let currentHash = CoreCryptographicVerifier.hash(leafData);

        for (const node of proofPath) {
            if (node.position === 'left') {
                currentHash = CoreCryptographicVerifier.hash(node.hash + currentHash);
            } else if (node.position === 'right') {
                currentHash = CoreCryptographicVerifier.hash(currentHash + node.hash);
            } else {
                return false; // Invalid proof structure
            }
        }

        return currentHash === rootHash;
    }
}