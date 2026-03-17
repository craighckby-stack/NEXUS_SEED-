/**
 * Telemetry Input Attestation Registrar Kernel (TIAR V94.1 - Refactored)
 *
 * Role: Ensures non-repudiation and cryptographic integrity of decision input vectors 
 * (S-01, S-02) immediately prior to P-01 execution by the OGT. Guarantees the
 * Irreversible Mutation Gate operates on provably attested data.
 *
 * Dependencies: KeyManager, AttestationStore, DataIntegrityProcessor, TelemetryAttestationConfigRegistryKernel, [Optional: Logger].
 * GSEP Alignment: Stage 3 (Pre-P-01 Gate Execution)
 */

class TelemetryInputAttestationRegistrarKernel {
    
    /**
     * @param {object} dependencies 
     * @param {KeyManagementService} dependencies.keyManager - Service for signing/verifying.
     * @param {AttestationStoreInterface} dependencies.attestationStore - Persistence layer for commitments.
     * @param {DataIntegrityProcessor} dependencies.dataIntegrityProcessor - Plugin for deterministic data fingerprinting (canonicalization + hashing).
     * @param {TelemetryAttestationConfigRegistryKernel} dependencies.configRegistry - Configuration constants.
     * @param {string} [dependencies.hashAlgorithm] - Optional runtime hash algorithm override.
     * @param {Logger} [dependencies.logger] - Structured logger interface.
     */
    constructor(dependencies) {
        this._dependencies = dependencies;
        this.#setupDependencies();
    }

    /**
     * Isolates dependency initialization and configuration loading.
     * All configuration constants are retrieved from the injected registry.
     */
    #setupDependencies() {
        const { keyManager, attestationStore, dataIntegrityProcessor, configRegistry, hashAlgorithm, logger } = this._dependencies;

        if (!keyManager || !attestationStore || !dataIntegrityProcessor || !configRegistry) {
            throw new Error("TIAR Initialization Failure: Core dependencies missing (keyManager, attestationStore, dataIntegrityProcessor, configRegistry).");
        }

        // Core immutable dependencies
        this.keyManager = Object.freeze(keyManager);
        this.attestationStore = Object.freeze(attestationStore);
        this.dataIntegrityProcessor = Object.freeze(dataIntegrityProcessor); 
        this.configRegistry = configRegistry;
        
        // Configuration derived from registry
        const defaultHashAlgorithm = this.configRegistry.getDefaultHashAlgorithm();
        this.protocolVersion = this.configRegistry.getProtocolVersion();
        
        // Allow runtime override for the hash algorithm
        this.hashAlgorithm = hashAlgorithm || defaultHashAlgorithm;
        this.logger = logger || console;
    }

    /**
     * Receives raw inputs, signs the deterministic hash, and registers the commitment.
     * 
     * @param {object} inputVector - Contains raw S-01, S-02 data points and metadata.
     * @returns {Promise<object>} Contains the cryptographic hash and signature.
     */
    async attestInputs(inputVector) {
        
        // 1. Generate Deterministic Hash using the abstracted processor
        const inputHash = await this.dataIntegrityProcessor.getDeterministicFingerprint(
            inputVector,
            this.hashAlgorithm
        );
        
        // 2. Sign the Hash (cryptographic proof of possession and commitment)
        const signature = await this.keyManager.sign(inputHash);

        // 3. Construct and register the attestation commitment record
        const attestationCommitment = {
            hash: inputHash,
            signature: signature,
            timestamp: Date.now(), // Local time approximation
            signerId: this.keyManager.getIdentityId(), 
            protocolVersion: this.protocolVersion // Use injected constant
        };
        
        // Note: Only the small cryptographic commitment goes into the store.
        await this.attestationStore.storeAttestation(attestationCommitment);

        this.logger.info(`TIAR: Input vector attested. Hash: ${inputHash}`, { signer: attestationCommitment.signerId });
        
        return { hash: inputHash, signature: signature };
    }
    
    /**
     * Verifies the integrity and authenticity of a claimed input vector against a registered commitment.
     * @param {string} claimedHash - The registered hash reference the input is claimed to match.
     * @param {object} inputDataToVerify - The input data being claimed/validated.
     * @returns {Promise<object>} Validation result object.
     */
    async verifyAttestation(claimedHash, inputDataToVerify) {
        
        // 1. Retrieve the registered commitment
        const commitmentRecord = await this.attestationStore.getAttestation(claimedHash);
        if (!commitmentRecord) {
            return { valid: false, code: "E_NOT_FOUND", reason: "Attestation commitment not registered." };
        }

        // 2. Recalculate hash of the provided input to verify content integrity
        const reCalculatedHash = await this.dataIntegrityProcessor.getDeterministicFingerprint(
            inputDataToVerify,
            this.hashAlgorithm
        );

        if (reCalculatedHash !== commitmentRecord.hash) {
            return { valid: false, code: "E_HASH_MISMATCH", reason: "Input content integrity failure: Provided data does not match the committed hash." };
        }

        // 3. Verify cryptographic signature against the stored identity
        const isSignatureValid = await this.keyManager.verify(
            commitmentRecord.hash, 
            commitmentRecord.signature, 
            commitmentRecord.signerId 
        );

        if (!isSignatureValid) {
            return { valid: false, code: "E_SIG_INVALID", reason: "Cryptographic signature validation failure (non-repudiation error)." };
        }
        
        this.logger.debug(`TIAR: Attestation verified successfully for hash: ${claimedHash}`);
        
        return {
            valid: true,
            signerId: commitmentRecord.signerId,
            timestamp: commitmentRecord.timestamp,
            protocol: commitmentRecord.protocolVersion
        };
    }
}

module.exports = TelemetryInputAttestationRegistrarKernel;
