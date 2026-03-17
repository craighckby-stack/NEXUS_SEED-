const crypto = require('crypto');

/**
 * Provides utilities for deterministic serialization (Canonical JSON) and 
 * Merkle tree generation required for Artifact Integrity Cryptography (AICV).
 * 
 * Ensures that artifact input is prepared consistently regardless of system state 
 * to guarantee identical hashes for identical content.
 */
class CanonicalSerializer {
    /**
     * @param {string} [algorithm='sha256'] - The cryptographic hash algorithm to use (e.g., 'sha256', 'sha512').
     */
    constructor(algorithm = 'sha256') {
        this.algorithm = algorithm.toLowerCase();
        // Basic check to ensure the algorithm is available, though Node.js crypto handles most errors robustly.
        if (!crypto.getHashes().includes(this.algorithm)) {
            console.warn(`Hash algorithm "${algorithm}" may be unsupported. Proceeding with defined standard.`);
        }
    }

    /**
     * Recursively sorts object keys for deterministic serialization.
     * @param {*} data 
     * @returns {*} 
     */
    _sortKeysDeep(data) {
        if (data && typeof data === 'object' && !Array.isArray(data) && data !== null) {
            const sorted = {};
            // Iterate over sorted keys
            for (const key of Object.keys(data).sort()) {
                sorted[key] = this._sortKeysDeep(data[key]);
            }
            return sorted;
        }
        if (Array.isArray(data)) {
            // Recurse into arrays
            return data.map(item => this._sortKeysDeep(item));
        }
        return data;
    }

    /**
     * Returns deterministically ordered, tightly packed JSON serialization (Canonical JSON).
     * @param {Object} data 
     * @returns {Buffer}
     */
    serialize(data) {
        try {
            // 1. Ensure deep key sorting
            const sortedData = this._sortKeysDeep(data);
            
            // 2. Tightly packed JSON (sort_keys=True, separators=(',', ':'))
            const jsonString = JSON.stringify(sortedData);

            // 3. Consistent encoding
            return Buffer.from(jsonString, 'utf-8');

        } catch (e) {
            throw new Error(`Input data is not JSON serializable: ${e.message}`);
        }
    }

    /**
     * Serializes data canonically and returns its hexadecimal digest.
     * @param {Object} data
     * @returns {string} Hexadecimal digest.
     */
    calculateDigest(data) {
        const serializedData = this.serialize(data);
        return crypto.createHash(this.algorithm).update(serializedData).digest('hex');
    }

    /**
     * Internal helper to compute the Merkle root hash iteratively.
     * @param {Buffer[]} currentHashes 
     * @returns {string} Merkle Root as hex string.
     */
    _computeMerkleRoot(currentHashes) {
        if (currentHashes.length === 0) {
            // Matches standard behavior: hash of empty bytes if starting list is empty.
            return crypto.createHash(this.algorithm).update(Buffer.from('')).digest('hex');
        }

        let levelHashes = currentHashes;
        
        // Iterate until only one hash remains (the root)
        while (levelHashes.length > 1) {
            const nextLevel = [];
            let i = 0;

            while (i < levelHashes.length) {
                const left = levelHashes[i];
                let right;
                
                // If odd number of nodes, the last node is paired with itself (promoted)
                if (i + 1 < levelHashes.length) {
                    right = levelHashes[i + 1];
                } else {
                    right = left; // Self-promotion
                }
                
                // Standard Merkle node construction: H(L || R)
                const combined = Buffer.concat([left, right]);
                const nodeHash = crypto.createHash(this.algorithm).update(combined).digest();
                nextLevel.push(nodeHash);
                
                i += 2;
            }
            levelHashes = nextLevel;
        }
        
        // Return the final root hash as hex string
        return levelHashes[0].toString('hex');
    }

    /**
     * Generates the Merkle root hash from a list of serialized data chunks.
     * @param {Buffer[] | string[]} chunks - List of data buffers/chunks.
     * @returns {string} Hexadecimal Merkle Root.
     */
    generateMerkleRoot(chunks) {
        if (!chunks || chunks.length === 0) {
            return this._computeMerkleRoot([]); 
        }

        // 1. Compute leaf hashes
        const leafHashes = chunks.map(chunk => {
            // Ensure input is a Buffer
            const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf-8');
            return crypto.createHash(this.algorithm).update(chunkBuffer).digest();
        });
        
        // 2. Compute the root iteratively
        return this._computeMerkleRoot(leafHashes);
    }
}

module.exports = { CanonicalSerializer };