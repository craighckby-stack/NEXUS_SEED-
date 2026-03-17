// src/governance/integrityQuarantine.js
/**
 * Role: Post-Execution Integrity and Quarantine Enforcement (PEIQ)
 * Monitors post-execution metrics from FBA and triggers mandatory auditing/quarantine
 * if calculated risk exceeds the operational threshold.
 * Note: Refactored to accept consolidated configuration and utilize standardized risk keys.
 */

// Using standardized risk keys helps downstream analysis and cross-component consistency.
const RISK_KEYS = {
    SCORE: 'aggregateRisk',
    THRESHOLD: 'failureThreshold',
    STATUS: {
        BREACH: 'INTEGRITY_BREACH',
        QUARANTINED: 'QUARANTINED_FAILURE'
    }
};

class IntegrityQuarantine {
    /**
     * @param {object} dependencies - Core system dependencies.
     * @param {object} dependencies.auditLogger - The Decision Audit Logger instance (expected to support structured logging).
     * @param {object} dependencies.fba - The Feedback Loop Aggregator instance.
     * @param {object} dependencies.artifactArchiver - A robust utility for moving/copying payloads.
     * @param {object} config - Configuration parameters.
     * @param {number} config.failureThreshold - Threshold derived from risk parameters (e.g., 0.8).
     * @param {string} config.quarantinePath - Archive location for failed payloads.
     */
    constructor({ auditLogger, fba, artifactArchiver }, config) {
        if (!auditLogger || !fba || !artifactArchiver) {
            throw new Error("IntegrityQuarantine requires auditLogger, fba, and artifactArchiver dependencies.");
        }
        if (!config || typeof config.failureThreshold !== 'number' || typeof config.quarantinePath !== 'string') {
             throw new Error("IntegrityQuarantine requires valid config { failureThreshold, quarantinePath }.");
        }

        this.auditLogger = auditLogger;
        this.fba = fba;
        this.artifactArchiver = artifactArchiver;
        this.config = config; 
    }

    /**
     * Internal method to check if the calculated risk triggers a mandatory quarantine.
     * @private
     * @param {number} riskScore
     * @returns {boolean}
     */
    _isBreach(riskScore) {
        return riskScore > this.config.failureThreshold;
    }

    /**
     * Generates a high-priority runtime notification for the breach.
     * @private
     * @param {string} proposalId
     * @param {number} risk
     */
    _notifyBreach(proposalId, risk) {
        const riskFormatted = risk.toFixed(4);
        const thresholdFormatted = this.config.failureThreshold.toFixed(4);
        console.warn(`[IQ/PEIQ ALERT] Proposal ID ${proposalId} triggered mandatory quarantine. Risk (${riskFormatted}) exceeded threshold (${thresholdFormatted}).`);
    }

    /**
     * @async
     * Evaluates FBA metrics post-C-04 execution and enforces quarantine if integrity is compromised.
     * @param {string} proposalId - The ID of the currently executed architectural payload (A-01 artifact).
     * @param {object} executionMetrics - Data provided by FBA on stability/performance/risk vectors.
     * @returns {Promise<boolean>} True if post-execution integrity holds, false if quarantine is triggered.
     */
    async monitor(proposalId, executionMetrics) {
        // 1. Calculate aggregated failure risk
        const aggregateRisk = await this.fba.calculatePostExecutionRisk(executionMetrics);

        if (this._isBreach(aggregateRisk)) {
            
            this._notifyBreach(proposalId, aggregateRisk);
            
            // 2. Trigger mandatory structured audit log
            const auditEntry = {
                proposalId,
                type: RISK_KEYS.STATUS.BREACH,
                status: RISK_KEYS.STATUS.QUARANTINED,
                [RISK_KEYS.SCORE]: aggregateRisk,
                [RISK_KEYS.THRESHOLD]: this.config.failureThreshold,
                context: executionMetrics, 
                timestamp: new Date().toISOString()
            };
            // Using a structured logging method for clarity and standardization
            await this.auditLogger.logStructuredEvent(auditEntry); 

            // 3. Move the failed payload (A-01 artifact) to quarantine
            await this._enforceQuarantine(proposalId);

            // 4. Signal failure
            return false;
        }

        return true;
    }

    /**
     * Archives the failed artifact payload using the dedicated archiver utility.
     * @private
     * @param {string} proposalId 
     * @returns {Promise<void>}
     */
    async _enforceQuarantine(proposalId) {
        try {
            await this.artifactArchiver.archiveArtifact(proposalId, this.config.quarantinePath);
            console.log(`[IQ/Archive Success] Payload ${proposalId} secured in quarantine: ${this.config.quarantinePath}`);
        } catch (error) {
            // CRITICAL: Archival failure must be highly visible, as it compromises data retention and future auditing.
            console.error(`IQ/CRITICAL ARCHIVE FAILURE: Failed to move proposal ${proposalId} to quarantine. Error: ${error.message}`);
            // Note: Not re-throwing, but governance should mandate this error triggers an external health monitor alert.
        }
    }
}

module.exports = IntegrityQuarantine;
