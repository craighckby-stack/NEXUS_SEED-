/**
 * Component ID: RSAM (Rule Set Attestation Manager)
 * Optimization Directive: Maximum computational efficiency and recursive abstraction.
 * Refactoring Focus: Functional decomposition via recursive pipeline execution and concurrent processing.
 */
class RuleSetAttestationManager {
    /**
     * @param {object} grs - Governance Rule Source reference
     * @param {object} ktam - Key & Trust Anchor Manager for signing
     * @param {object} asr - Architectural Schema Registrar for validation
     * @param {object} telemetry - Structured logging/monitoring system
     */
    constructor(grs, ktam, asr, telemetry) {
        // Minimize internal state footprint and ensure O(1) lookup
        this.grs = grs;
        this.ktam = ktam;
        this.asr = asr;
        this.telemetry = telemetry;
        this.stagingBuffer = new Map(); 
    }

    /**
     * Core utility: Performs concurrent schema validation and cryptographic hashing.
     * Maximizes throughput by overlapping potential I/O (ASR) with CPU work (KTAM hashing).
     * @param {object} proposedRuleSet
     * @returns {Promise<{ruleHash: string, validationResult: object}>}
     * @private
     */
    async _validateAndHash(proposedRuleSet) {
        // Highly optimized concurrent execution using Promise.all
        const [validationResult, ruleHash] = await Promise.all([
            this.asr.validatePolicySchema(proposedRuleSet), // I/O or CPU intensive validation
            this.ktam.generateAttestationHash(proposedRuleSet) // CPU intensive hashing
        ]);
        
        if (!validationResult.valid) {
            const err = new Error('SCHEMA_INVALID');
            err.details = validationResult.errors;
            throw err;
        }

        return { ruleHash, validationResult };
    }

    /**
     * Stages a new governance rule set and performs initial structural vetting asynchronously.
     * @returns {Promise<object>}
     */
    async stagePolicyUpdate(proposedRuleSet, mutationId, sourceMetadata) {
        try {
            const { ruleHash } = await this._validateAndHash(proposedRuleSet);
            const timestamp = Date.now();

            // Atomic Staging
            this.stagingBuffer.set(mutationId, { 
                rules: proposedRuleSet, 
                ruleHash: ruleHash, 
                status: 'STAGED', 
                stageTime: timestamp,
                source: sourceMetadata 
            });
            
            this.telemetry.info('RSAM_POLICY_STAGED', { mutationId, ruleHash: ruleHash.substring(0, 16) });
            return { success: true, hash: ruleHash };

        } catch (e) {
            if (e.message === 'SCHEMA_INVALID') {
                this.telemetry.critical('RSAM_VETO', { mutationId, reason: 'Schema validation failure', details: e.details });
                return { success: false, reason: 'SCHEMA_INVALID' };
            }
            throw e;
        }
    }

    // --- Start of Recursive Abstraction and Functional Decomposition ---

    /**
     * Step 1: Determines the next logical version for the governance rule set.
     * Input State: { stage, committingAgentId }
     * Output State: { stage, newVersion, committingAgentId }
     * @private
     */
    async _stepVersioning({ stage, committingAgentId }) {
        const newVersion = await this.grs.proposeNextVersion(stage.ruleHash);
        return { stage, newVersion, committingAgentId }; 
    }

    /**
     * Step 2: Creates the necessary metadata payload for cryptographic signing.
     * @private
     */
    async _stepCreatePayload(state) {
        const commitmentPayload = {
            dataHash: state.stage.ruleHash,
            version: state.newVersion,
            agent: state.committingAgentId,
            timestamp: Date.now()
        };
        return { ...state, commitmentPayload };
    }

    /**
     * Step 3: Cryptographically signs the payload using the Key & Trust Anchor Manager.
     * @private
     */
    async _stepSignAttestation(state) {
        const attestation = await this.ktam.createCryptographicAttestation(state.commitmentPayload, 'RSAM_POLICY_LOCK');
        return { ...state, attestation };
    }

    /**
     * Step 4: Atomically activates the attested rule set within the Governance Rule Source.
     * @private
     */
    async _stepActivateGRS(state) {
        await this.grs.activateNewRuleSet(state.stage.rules, state.newVersion, state.attestation);
        // Final result payload
        return { version: state.newVersion, attestation: state.attestation };
    }

    /**
     * Core Recursive Pipeline Executor.
     * Executes a series of sequential asynchronous steps, passing state forward.
     * This enforces strict dependencies functionally.
     * @param {object} initialState - The data passed into the first step.
     * @param {Array<Function>} steps - Array of asynchronous functions (step handlers).
     * @private
     */
    async _executePipeline(initialState, steps) {
        // Base case: If no steps remain, the pipeline is complete.
        if (steps.length === 0) {
            return initialState;
        }

        const [currentStep, ...remainingSteps] = steps;
        
        // Recursive step: Execute the current function and pass its result
        // as the input state for the rest of the pipeline.
        const intermediateState = await currentStep(initialState);

        return this._executePipeline(intermediateState, remainingSteps);
    }

    /**
     * Initializes and orchestrates the recursively defined commitment pipeline.
     * @private
     */
    async _abstractCommitmentInitiator(stage, committingAgentId) {
        const initialState = { stage, committingAgentId };
        
        const commitmentSteps = [
            this._stepVersioning.bind(this),
            this._stepCreatePayload.bind(this),
            this._stepSignAttestation.bind(this),
            this._stepActivateGRS.bind(this)
        ];
        
        return this._executePipeline(initialState, commitmentSteps);
    }

    /**
     * Executes cryptographic signing, version-locks the policy set, and triggers GRS activation.
     * @returns {Promise<object|null>}
     */
    async attestAndCommitPolicy(mutationId, committingAgentId) {
        const stage = this.stagingBuffer.get(mutationId);

        if (!stage || stage.status !== 'STAGED') {
            this.telemetry.warn('RSAM_COMMIT_FAIL', { mutationId, reason: 'State mismatch or missing stage entry.' });
            return null;
        }

        try {
            // Use the recursively defined, abstracted commitment pipeline
            const result = await this._abstractCommitmentInitiator(stage, committingAgentId);

            // Cleanup and Telemetry
            this.stagingBuffer.delete(mutationId); 
            this.telemetry.success('RSAM_COMMITTED', { mutationId, version: result.version, attestationId: result.attestation.signatureId.substring(0, 16) });
            return result;

        } catch (error) {
            this.telemetry.critical('RSAM_COMMIT_GRS_FAILURE', { mutationId, error: error.message, stack: error.stack });
            return null; 
        }
    }

    /**
     * Provides the currently attested governance state for C-15 policy checks (S-03 input).
     * @returns {object}
     */
    getCurrentAttestedRules() {
        return this.grs.getActiveRuleSet();
    }
}

module.exports = RuleSetAttestationManager;