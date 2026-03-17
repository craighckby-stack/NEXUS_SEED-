// core/utils/CoreCryptographicVerifier.js

import { MerkleProofVerifierTool } from '@/plugins/MerkleProofVerifierTool';
import { IntegrityHashingUtility } from '@/plugins/IntegrityHashingUtility';

/**
 * CoreCryptographicVerifier
 * Utility class for advanced state integrity verification (Merkle Proofs, HMACs).
 * This is crucial for systems relying on root hashes (like SCL), as verification 
 * should prove inclusion cryptographically, not just rely on DB consistency.
 */
export class CoreCryptographicVerifier {

    /**
     * Standardized SHA-256 Hashing for internal primitives.
     * Delegates hashing responsibility to the centralized IntegrityHashingUtility.
     *
     * @param {string|Buffer} data
     * @returns {string} Hex encoded hash
     */
    static hash(data: string | Buffer): string {
        // Optimized: Direct delegation to the utility, removing the unnecessary private proxy method.
        return IntegrityHashingUtility.calculateSha256(data);
    }

    /**
     * Verifies a Merkle Proof against a known Merkle Root.
     * Delegates complex cryptographic path verification logic to the specialized MerkleProofVerifierTool.
     *
     * @param {string} rootHash - The expected Merkle Root Hash.
     * @param {string} leafData - The data whose inclusion needs to be proven.
     * @param {Array<{hash: string, position: 'left' | 'right'}>} proofPath - Array of proof nodes.
     * @returns {boolean} True if the proof verifies.
     */
    static verifyMerkleProof(
        rootHash: string,
        leafData: string,
        proofPath: Array<{hash: string, position: 'left' | 'right'}>
    ): boolean {
        // Optimized: Direct delegation to the utility, removing the unnecessary private proxy method.
        return MerkleProofVerifierTool.execute({
            rootHash,
            leafData,
            proofPath
        });
    }
}