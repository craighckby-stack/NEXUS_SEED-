/**
 * Component: A-01 Architectural Proposal Manager (APM)
 * Role: Securely stages accepted architectural mutation payloads, ensuring integrity
 * and immutability between OGT consensus (D-01 decision) and execution (C-04).
 * ID: A-01
 *
 * This component prevents tampering of the approved codebase prior to atomic deployment
 * and compiles the necessary rollback metadata.
 */

import { D01_AuditLogger } from './decisionAuditLogger.js';
import { C04_AutogenySandbox } from '../execution/autogenySandbox.js';
// New core dependency for cryptographic integrity checks
import { CryptographicUtil } from '../utils/cryptographicUtil.js'; 

export class ArchProposalManager {
    constructor() {
        /** @type {Map<string, StagingEntry>} */
        this.stagingArea = new Map();
        this.auditLogger = new D01_AuditLogger();
    }

    /**
     * Internal secure hashing method, utilizing dedicated cryptographic utility.
     * @param {Object} payload 
     * @returns {string} The cryptographic hash (e.g., SHA-256).
     * @private
     */
    _calculatePayloadHash(payload) {
        // Use a dedicated, deterministic hashing function for payloads
        return CryptographicUtil.hashObject(payload);
    }

    /**
     * @typedef {Object} DecisionEnvelope
     * @property {string} status - 'PASS', 'FAIL', etc.
     * @property {string} rationale - Consensus justification.
     */

    /**
     * Stages a validated proposal payload upon successful OGT decision.
     * Ensures payload immutability via Object.freeze and robust hashing.
     * 
     * @param {string} proposalId 
     * @param {Object} proposalPayload - The mutation manifest (code changes, config updates).
     * @param {DecisionEnvelope} decisionEnvelope 
     * @returns {string | boolean} The transaction hash on success, or false on failure.
     */
    stageProposal(proposalId, proposalPayload, decisionEnvelope) {
        if (!decisionEnvelope || decisionEnvelope.status !== 'PASS') {
            this.auditLogger.logWarning(`A-01: Received rejected or invalid envelope for proposal ${proposalId}. Aborting stage.`);
            return false;
        }

        const transactionHash = this._calculatePayloadHash(proposalPayload);
        
        /** @typedef {Object} StagingEntry */
        const stagingEntry = Object.freeze({ // Enforce entry immutability immediately
            proposalId,
            payload: proposalPayload, 
            decision: decisionEnvelope,
            hash: transactionHash,
            timestamp: Date.now()
        });

        this.stagingArea.set(proposalId, stagingEntry);
        this.auditLogger.logAction(`A-01: Proposal ${proposalId} staged successfully. Hash: ${transactionHash.substring(0, 10)}...`);
        return transactionHash;
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
        
        // Final integrity check: Re-calculate and verify hash
        const reCalculatedHash = this._calculatePayloadHash(stagedProposal.payload);
        
        if (reCalculatedHash !== stagedProposal.hash) {
            this.auditLogger.logFatalError(`A-01: Data integrity failure for ${proposalId}. HASH MISMATCH detected between stage and commit. Execution aborted.`);
            return false;
        }

        this.auditLogger.logDebug(`A-01: Integrity check passed for ${proposalId}. Preparing C-04 handover.`);

        try {
            // Hand off to Autogeny Sandbox (C-04)
            const executionResult = C04_AutogenySandbox.executeMutation(stagedProposal.payload);
            
            if (executionResult) {
                this.stagingArea.delete(proposalId); // Clean staging area on success
                this.auditLogger.logAction(`A-01: Proposal ${proposalId} committed to C-04 successfully and staged entry deleted.`);
            } else {
                this.auditLogger.logError(`A-01: C-04 reported execution failure for ${proposalId}. Proposal remains staged.`);
            }
            return executionResult;
        } catch (error) {
            this.auditLogger.logFatalError(`A-01: Critical exception during C-04 execution handover for ${proposalId}: ${error.message}`);
            return false;
        }
    }
}