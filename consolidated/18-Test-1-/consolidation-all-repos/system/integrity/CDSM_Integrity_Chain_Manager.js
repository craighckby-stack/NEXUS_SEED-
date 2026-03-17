/**
 * CDSM_Integrity_Chain_Manager.js
 * Manages the sequential integrity and signing of CDSM_Auditor_Log entries.
 * Implements a lightweight log-chaining mechanism (hash of previous entry included in the current entry's signing payload).
 */

class IntegrityChainManager {
    constructor(signingKeyPath) {
        this.currentChainHash = null; // Stores the hash of the last successfully signed entry
        this.signer = new CryptoSigner(signingKeyPath, 'EdDSA');
    }

    async getPreviousHash() {
        // Load persistent state or fetch hash from the end of the last log rotation block.
        return this.currentChainHash || 'INITIAL_BLOCK_HASH';
    }

    async signLogEntry(entryPayload) {
        const previousHash = await this.getPreviousHash();

        // Prepare payload for signing: combines entry content + previous chain link
        const signingInput = JSON.stringify({ ...entryPayload, previous_entry_hash: previousHash });

        const signature = await this.signer.generateSignature(signingInput);

        // Update the current chain hash for the next entry
        this.currentChainHash = HashingUtility.SHA256(signingInput);

        return {
            previous_entry_hash: previousHash,
            log_entry_signature: signature,
            signer_service_id: 'IntegrityChainManager_v1'
        };
    }
}

module.exports = IntegrityChainManager;