/**
 * AGI-KERNEL v7.11.3 - MutationChainRegistrarKernel
 * Responsibility: Maintains an immutable, cryptographically chained ledger of all successful 
 * architectural mutations (A-01 payloads), ensuring strict integrity checks via asynchronous Tool Kernels.
 */

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class MutationChainRegistrarKernel {
    /**
     * @type {ReadonlyArray<MutationRecord>}
     */
    #chain = [];
    #isInitialized = false;

    /**
     * @param {object} dependencies 
     * @param {MultiTargetAuditDisperserToolKernel} dependencies.auditDisperser 
     * @param {HashIntegrityCheckerToolKernel} dependencies.hashChecker 
     * @param {CryptoPolicyValidatorKernel} dependencies.cryptoValidator 
     * @param {IMutationChainPersistenceToolKernel} dependencies.ledgerPersistence 
     * @param {ICryptographicChainVerifierToolKernel} dependencies.chainVerifier 
     */
    constructor({ auditDisperser, hashChecker, cryptoValidator, ledgerPersistence, chainVerifier }) {
        if (!hashChecker || !ledgerPersistence || !chainVerifier || !auditDisperser || !cryptoValidator) {
            throw new Error("MCRKernel requires all specified Tool Kernel dependencies.");
        }

        this.auditDisperser = auditDisperser; 
        this.hashChecker = hashChecker; 
        this.cryptoValidator = cryptoValidator;
        this.ledgerPersistence = ledgerPersistence;
        this.chainVerifier = chainVerifier;
    }

    /**
     * Initializes the registrar by loading historical data asynchronously and verifying linkage.
     * Enforces non-blocking I/O and cryptographic verification.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.#isInitialized) return;
        
        try {
            // Load history. IMutationChainPersistenceToolKernel must return an immutable array.
            const loadedChain = await this.ledgerPersistence.loadChainHistory();
            
            if (loadedChain.length > 0) {
                
                await this.auditDisperser.logEvent('MCR_LOAD', {
                    message: `Loaded ${loadedChain.length} records from history.`,
                    lastHash: this.getLatestChainHash(loadedChain).substring(0, 10) + '...'
                });
                
                // Verify linkage using the dedicated asynchronous kernel
                if (!(await this.#verifyFullChainIntegrity(loadedChain))) {
                     throw new Error("Loaded chain failed internal cryptographic linkage verification.");
                }
            } else {
                await this.auditDisperser.logEvent('MCR_INIT', 'Initialized GENESIS chain.');
            }
            
            // Set the immutable internal state
            this.#chain = Object.freeze(loadedChain);
            this.#isInitialized = true;

        } catch (error) {
            await this.auditDisperser.logCritical('MCR_INIT_FAILURE', {
                message: `Failed to initialize chain history: ${error.message}`,
                error: error.name
            });
            // Must halt operations if chain history cannot be loaded/verified.
            throw new Error(`Critical failure loading mutation chain history: ${error.message}`);
        }
    }

    /**
     * Validates the cryptographic linkage and self-hashes of every record in the chain
     * using the specialized ICryptographicChainVerifierToolKernel.
     * @param {ReadonlyArray<MutationRecord>} chainToVerify
     * @returns {Promise<boolean>}
     */
    async #verifyFullChainIntegrity(chainToVerify) {
        if (chainToVerify.length === 0) return true;

        // Provide the stable hash calculation utility from the HashIntegrityCheckerToolKernel
        const hashCalculator = async (data) => this.hashChecker.calculateStableHash(data);

        const verificationResult = await this.chainVerifier.verifyChain(
            chainToVerify,
            GENESIS_HASH,
            hashCalculator
        );

        if (!verificationResult.success) {
            await this.auditDisperser.logError('MCR_INTEGRITY_FAIL', { 
                reason: verificationResult.reason 
            });
            return false;
        }

        await this.auditDisperser.logEvent('MCR_INTEGRITY_OK', 'Chain structure verified successfully.');
        return true;
    }

    /**
     * Registers a finalized (A-01 locked) payload into the evolutionary chain.
     * @param {object} payload - The signed and versioned architectural manifest.
     * @param {string} p01ConfirmationHash - The immutable hash from D-01 proving P-01 success.
     * @returns {Promise<string>} The selfHash of the newly registered record.
     */
    async registerMutation(payload, p01ConfirmationHash) {
        if (!this.#isInitialized) {
            throw new Error("MCR must be initialized before registering mutations.");
        }

        // Use CryptoPolicyValidatorKernel for mandated signature verification (non-blocking).
        const signatureVerified = await this.cryptoValidator.verifyArchitecturalSignature(payload);
        
        if (!signatureVerified) {
            await this.auditDisperser.logError('MCR_FAILURE', {
                message: `Payload signature verification failed.`,
                versionId: payload.versionId || 'unknown',
                reason: 'Invalid cryptographic signature on A-01 manifest.'
            });
            throw new Error("MCR Registration Failure: Invalid cryptographic signature on A-01 manifest.");
        }
        
        // 1. Structure the new record
        const latestChainHash = this.getLatestChainHash(this.#chain);
        
        if (!payload.manifest) {
             throw new Error("Payload must contain a manifest for architectural hashing.");
        }

        const architecturalHash = await this.hashChecker.calculateStableHash(payload.manifest);

        const newRecordWithoutHash = {
            timestamp: Date.now(),
            mutationId: payload.versionId,
            architecturalHash: architecturalHash, 
            p01Hash: p01ConfirmationHash, 
            previousChainHash: latestChainHash
        };

        // 2. Calculate the linkage hash (selfHash)
        const selfHash = await this.hashChecker.calculateStableHash(newRecordWithoutHash);
        
        // Create the final, immutable record
        const newRecord = Object.freeze({ ...newRecordWithoutHash, selfHash });
        
        // 3. Prepare new chain state and asynchronously persist
        
        try {
            // Use the IMutationChainPersistenceToolKernel for non-blocking I/O
            await this.ledgerPersistence.persistRecord(newRecord);
        } catch (error) {
            await this.auditDisperser.logCritical('MCR_PERSISTENCE_FAIL', { 
                versionId: payload.versionId,
                error: error.message,
                note: 'Persistence failure. Local state maintained via non-commit.'
            });
            throw new Error(`Persistence failure during MCR commit: ${error.message}`);
        }

        // 4. Commit to the new immutable state
        const newChain = [...this.#chain, newRecord];
        this.#chain = Object.freeze(newChain);

        await this.auditDisperser.logEvent('MCR_COMMITMENT', {
            versionId: payload.versionId,
            message: `Mutation committed.`,
            selfHash: selfHash.substring(0, 10) + '...'
        });
        
        return selfHash;
    }

    /**
     * Retrieves the selfHash of the most recent record from a given chain reference.
     * @param {ReadonlyArray<MutationRecord>} [chainRef]
     * @returns {string}
     */
    getLatestChainHash(chainRef = this.#chain) {
        if (chainRef.length === 0) return GENESIS_HASH;
        return chainRef[chainRef.length - 1].selfHash;
    }

    getChainLength() {
        return this.#chain.length;
    }

    /**
     * Returns the current mutation chain as an immutable reference.
     * @returns {ReadonlyArray<MutationRecord>}
     */
    getChain() {
        return this.#chain;
    }
}

module.exports = MutationChainRegistrarKernel;