/**
 * Component: A-01 Architectural Proposal Manager (APM)
 * Role: Securely stages accepted architectural mutation payloads, ensuring integrity
 * and immutability between OGT consensus (D-01 decision) and execution (C-04).
 * ID: A-01
 *
 * Refactored for maximum computational efficiency and recursive abstraction.
 * The core logic relies on generating a single, immutable, cryptographically
 * attested proof object (StagingEntry) which abstracts the payload's state.
 */

import { D01_AuditLogger } from './decisionAuditLogger.js';
import { C04_AutogenySandbox } from '../execution/autogenySandbox.js';
import { CryptographicUtil } from '../utils/cryptographicUtil.js'; 

export class ArchProposalManager {
    constructor() {
        /** @type {Map<string, Readonly<StagingEntry>>} */
        this.stagingArea = new Map();
        this.auditLogger = new D01_AuditLogger();
    }

    /**
     * @typedef {Object} DecisionEnvelope
     * @property {string} status - 'PASS', 'FAIL', etc.
     * @property {string} rationale - Consensus justification.
     */

    /**
     * @typedef {Object} StagingEntry
     * @property {string} proposalId
     * @property {Object} payload
     * @property {DecisionEnvelope} decision
     * @property {string} hash
     * @property {number} timestamp
     */

    /**
     * Generates an immutable, cryptographically attested staging entry.
     * This serves as the core recursive abstraction: reducing the complex input (payload, decision)
     * into a single, provable, frozen state object.
     * 
     * @param {string} proposalId
     * @param {Object} payload 
     * @param {DecisionEnvelope} decision 
     * @returns {Readonly<StagingEntry> | null} 
     * @private
     */
    _generateImmutableProof(proposalId, payload, decision) {
        // Efficiency: Base case for immediate exit if decision failed.
        if (decision?.status !== 'PASS') {
            return null;
        }

        // Recursive Abstraction step: Compute canonical proof of state.
        const transactionHash = CryptographicUtil.hashObject(payload);

        const stagingEntry = Object.freeze({
            proposalId,
            payload: payload, 
            decision: decision,
            hash: transactionHash,
            timestamp: Date.now()
        });

        // Returns the single, fully attested, read-only proof object.
        return stagingEntry;
    }

    /**
     * Stages a validated proposal payload upon successful OGT decision.
     * @param {string} proposalId 
     * @param {Object} proposalPayload 
     * @param {DecisionEnvelope} decisionEnvelope 
     * @returns {string | boolean} The transaction hash on success, or false on failure.
     */
    stageProposal(proposalId, proposalPayload, decisionEnvelope) {
        // Delegation to the abstract proof generator.
        const entry = this._generateImmutableProof(proposalId, proposalPayload, decisionEnvelope);

        if (!entry) {
            this.auditLogger.logWarning(`A-01: Received rejected or invalid envelope for proposal ${proposalId}. Aborting stage.`);
            return false;
        }

        // Direct insertion into the efficient Map structure.
        this.stagingArea.set(proposalId, entry);
        this.auditLogger.logAction(`A-01: Proposal ${proposalId} staged successfully. Hash: ${entry.hash.substring(0, 10)}...`);
        return entry.hash;
    }

    /**
     * Hand off the immutable execution envelope to C-04 for atomic deployment.
     * Performs a final integrity check before execution.
     * 
     * @param {string} proposalId
     * @returns {boolean} True if execution initiated successfully, false otherwise.
     */
    commitAndExecute(proposalId) {
        const stagedProposal = this.stagingArea.get(proposalId);

        if (!stagedProposal) {
            this.auditLogger.logError(`A-01: Proposal ${proposalId} not found in staging area. Execution failed.`);
            return false;
        }
        
        // Security Overhead (Mandatory Integrity Check): Re-hashing payload to guarantee memory integrity.
        if (CryptographicUtil.hashObject(stagedProposal.payload) !== stagedProposal.hash) {
            this.auditLogger.logFatalError(`A-01: Data integrity failure for ${proposalId}. HASH MISMATCH. Execution aborted.`);
            return false;
        }

        this.auditLogger.logDebug(`A-01: Integrity check passed for ${proposalId}. Preparing C-04 handover.`);

        try {
            // C-04 execution is the final operational step.
            const executionSuccess = C04_AutogenySandbox.executeMutation(stagedProposal.payload);

            if (executionSuccess) {
                // Efficient cleanup using Map.delete
                this.stagingArea.delete(proposalId); 
                this.auditLogger.logAction(`A-01: Proposal ${proposalId} committed to C-04 successfully and staged entry deleted.`);
            } else {
                this.auditLogger.logError(`A-01: C-04 reported execution failure for ${proposalId}. Proposal remains staged for audit.`);
            }
            return executionSuccess;
        } catch (error) {
            this.auditLogger.logFatalError(`A-01: Critical exception during C-04 execution handover for ${proposalId}: ${error.message}`);
            return false;
        }
    }
}