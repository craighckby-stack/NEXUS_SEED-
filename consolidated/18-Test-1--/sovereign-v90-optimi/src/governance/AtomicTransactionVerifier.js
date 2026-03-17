class AtomicTransactionVerifier {
    /**
     * @type {CryptoUtilityInterface}
     * @private
     */
    #crypto;

    /**
     * @type {SecureResourceLoaderInterface}
     * @private
     */
    #storageLoader;

    /**
     * @type {ILogger}
     * @private
     */
    #logger;

    /**
     * @type {IIntegrityAuditor}
     * @private
     */
    #integrityAuditor;

    /**
     * @param {object} dependencies
     * @param {CryptoUtilityInterface} dependencies.crypto
     * @param {SecureResourceLoaderInterface} dependencies.storageLoader
     * @param {ILogger} dependencies.logger
     * @param {IIntegrityAuditor} dependencies.integrityAuditor
     */
    constructor(dependencies) {
        this.#validateDependencies(dependencies);
        this.#crypto = dependencies.crypto;
        this.#storageLoader = dependencies.storageLoader;
        this.#logger = dependencies.logger;
        this.#integrityAuditor = dependencies.integrityAuditor;
    }

    /**
     * Validates required dependencies.
     * @private
     * @param {object} dependencies
     */
    #validateDependencies(dependencies) {
        const requiredDeps = ['crypto', 'storageLoader', 'logger', 'integrityAuditor'];
        const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
        
        if (missingDeps.length > 0) {
            throw new Error(`Missing required dependencies: ${missingDeps.join(', ')}`);
        }
    }

    /**
     * Executes a validation step with centralized error handling and logging.
     * @private
     * @param {string} deploymentID
     * @param {string} stepName
     * @param {function} auditDelegate
     * @param {Array<any>} args
     * @param {string} successKey
     * @param {string} failureReason
     * @returns {Promise<{isVerified: boolean, reason?: string} | null>}
     */
    async #executeValidationStep(deploymentID, stepName, auditDelegate, args, successKey, failureReason) {
        this.#logger.debug(`Executing validation step: ${stepName} for ${deploymentID}`);
        
        try {
            const result = await auditDelegate(...args);
            
            if (!result?.[successKey]) {
                const detailedReason = result?.reason || "Validation failed without specific reason";
                this.#logger.error(`Integrity breach: ${stepName} failed for ${deploymentID}. Reason: ${detailedReason}`);
                return { isVerified: false, reason: failureReason };
            }
            
            return null;
        } catch (error) {
            this.#logger.error(`Execution error in ${stepName}: ${error.message}`, { error });
            return { isVerified: false, reason: `Internal error during ${stepName}` };
        }
    }

    /**
     * Verifies the integrity of transaction artifacts.
     * @param {string} deploymentID 
     * @param {object} auditContext
     * @returns {Promise<{isVerified: boolean, reason?: string}>}
     */
    async verifyTransactionIntegrity(deploymentID, auditContext) {
        this.#logger.debug(`Starting integrity verification for ${deploymentID}`);
        
        // Load trace artifact
        const traceArtifact = await this.#loadTraceArtifact(deploymentID);
        if (!traceArtifact) {
            return { isVerified: false, reason: "Missing critical execution trace artifact" };
        }

        // Verify trace hash consistency
        const hashFailure = await this.#verifyTraceHash(deploymentID, traceArtifact, auditContext);
        if (hashFailure) return hashFailure;

        // Verify audit data signature
        const signatureFailure = await this.#verifyAuditSignature(deploymentID, auditContext);
        if (signatureFailure) return signatureFailure;

        this.#logger.info(`Transaction integrity verified for ${deploymentID}`);
        return { isVerified: true };
    }

    /**
     * Loads and validates the trace artifact.
     * @private
     * @param {string} deploymentID
     * @returns {Promise<object | null>}
     */
    async #loadTraceArtifact(deploymentID) {
        try {
            const artifact = await this.#storageLoader.loadResource(`trace-artifact://${deploymentID}`);
            return artifact?.traceLog ? artifact : null;
        } catch (error) {
            this.#logger.error(`Failed to load trace artifact for ${deploymentID}`, { error });
            return null;
        }
    }

    /**
     * Verifies the trace hash consistency.
     * @private
     * @param {string} deploymentID
     * @param {object} traceArtifact
     * @param {object} auditContext
     * @returns {Promise<{isVerified: boolean, reason?: string} | null>}
     */
    async #verifyTraceHash(deploymentID, traceArtifact, auditContext) {
        return this.#executeValidationStep(
            deploymentID,
            "Trace Hash Check",
            this.#integrityAuditor.verifyHashConsistency.bind(this.#integrityAuditor),
            [traceArtifact.traceLog, auditContext.expectedTraceHash, this.#crypto.hashArtifact.bind(this.#crypto)],
            'isConsistent',
            "C04 Execution Trace hash mismatch"
        );
    }

    /**
     * Verifies the audit data signature.
     * @private
     * @param {string} deploymentID
     * @param {object} auditContext
     * @returns {Promise<{isVerified: boolean, reason?: string} | null>}
     */
    async #verifyAuditSignature(deploymentID, auditContext) {
        return this.#executeValidationStep(
            deploymentID,
            "Audit Signature Check",
            this.#integrityAuditor.verifySignatureIntegrity.bind(this.#integrityAuditor),
            [auditContext.metrics, auditContext.auditSignature, this.#crypto.verifySignature.bind(this.#crypto)],
            'isValid',
            "SEA/FBA Audit data signature verification failed"
        );
    }
}

module.exports = AtomicTransactionVerifier;
