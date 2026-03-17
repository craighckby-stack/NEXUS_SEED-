import { createHash } from 'crypto';

/**
 * CoreCryptographicVerifier
 * Utility class optimized for state integrity verification (Merkle Proofs).
 * Employs internal Buffer operations for maximum computational efficiency,
 * abstracting the hashing step into high-speed primitives.
 */
export class CoreCryptographicVerifier {

    /**
     * Low-level hashing primitive. Returns Buffer for maximum speed and
     * avoids repeated string encoding/decoding during concatenation/rehashing.
     * @param {string|Buffer} data
     * @returns {Buffer} Raw hash buffer (32 bytes for SHA256)
     */
    static _rawHash(data) {
        return createHash('sha256').update(data).digest();
    }

    /**
     * Standardized SHA-256 Hashing (Public interface).
     * @param {string|Buffer} data
     * @returns {string} Hex encoded hash
     */
    static hash(data) {
        return CoreCryptographicVerifier._rawHash(data).toString('hex');
    }

    /**
     * Core recursive abstraction step: Efficiently combines two hex-encoded
     * hashes (A and B) and returns the hash of the concatenation H(A || B).
     * Uses Buffer allocation and concatenation for efficiency.
     * @param {string} leftHashHex - 64 char hex string
     * @param {string} rightHashHex - 64 char hex string
     * @returns {string} The new parent hash (hex encoded)
     */
    static _combineHashes(leftHashHex, rightHashHex) {
        const leftBuffer = Buffer.from(leftHashHex, 'hex');
        const rightBuffer = Buffer.from(rightHashHex, 'hex');

        // Allocate 64 bytes using allocUnsafe for performance
        const combined = Buffer.allocUnsafe(leftBuffer.length * 2);
        
        leftBuffer.copy(combined, 0);
        rightBuffer.copy(combined, leftBuffer.length);

        return CoreCryptographicVerifier._rawHash(combined).toString('hex');
    }

    /**
     * Verifies a Merkle Proof against a known Merkle Root.
     * The verification loop uses the highly efficient _combineHashes primitive.
     *
     * @param {string} rootHash - The expected Merkle Root Hash (hex).
     * @param {string} leafData - The data whose inclusion needs to be proven.
     * @param {Array<{hash: string, position: 'left' | 'right'}>} proofPath - Array of proof nodes.
     * @returns {boolean} True if the proof verifies.
     */
    static verifyMerkleProof(rootHash, leafData, proofPath) {
        let currentHash = CoreCryptographicVerifier.hash(leafData);

        if (!proofPath || proofPath.length === 0) {
            // Base case: Root is the hash of the leaf itself
            return rootHash === currentHash;
        }

        for (const node of proofPath) {
            const proofHash = node.hash;
            
            if (node.position === 'left') {
                // Proof node is left, current hash is right: H(Proof + Current)
                currentHash = CoreCryptographicVerifier._combineHashes(proofHash, currentHash);
            } else if (node.position === 'right') {
                // Proof node is right, current hash is left: H(Current + Proof)
                currentHash = CoreCryptographicVerifier._combineHashes(currentHash, proofHash);
            } else {
                return false; // Invalid proof structure
            }
        }

        return currentHash === rootHash;
    }
}