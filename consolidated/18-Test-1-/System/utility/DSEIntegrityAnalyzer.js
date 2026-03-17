const fs = require('fs');

const Axioms = {
    GAX_I: "GAX I (Utility Efficacy)",
    GAX_II: "GAX II (Contextual Validity)",
    GAX_III: "GAX III (Constraint Integrity)"
};

const Severities = {
    CRITICAL: "Critical: Policy Violation",
    HIGH: "High: Environmental Mismatch",
    MEDIUM: "Medium: Performance Debt"
};

/**
 * Analyzes system artifacts and logs against governing Axioms (GAX) 
 * to determine the root cause candidates for operational halts.
 */
class DSEIntegrityAnalyzer {
    /**
     * @param {Object} artifactsData - The system's configuration snapshot and metrics.
     * @param {Object} logsData - The relevant log traces for context.
     */
    constructor(artifactsData, logsData) {
        if (typeof artifactsData !== 'object' || artifactsData === null || 
            typeof logsData !== 'object' || logsData === null) {
            throw new Error("DSEIntegrityAnalyzer requires valid artifact and log data objects.");
        }
        
        this.candidates = [];
        this.reportStatus = "SUCCESS_NO_HALT_EVIDENCE"; 
        this.artifacts = artifactsData;
        this.logs = logsData;
        // Safely determine initial stage, defaults to UNKNOWN
        this.initialStage = this.artifacts.last_stage || 'UNKNOWN'; 
    }

    _checkGaxIII() {
        // Checks for GAX III (Constraint Integrity). Critical priority failure.
        // If CSR_VALID is explicitly false, mark critical failure.
        const csrValid = this.artifacts.CSR_VALID;
        if (csrValid !== undefined && csrValid === false) {
            const trace = this.logs.MPAM || 'N/A';
            this.candidates.push({
                axiom: Axioms.GAX_III,
                artifact: "CSR (Configuration Snapshot Receipt)",
                trace: trace,
                severity: Severities.CRITICAL
            });
            this.reportStatus = "FAILURE_GAX_III";
        }
    }

    _checkGaxII() {
        // Checks for GAX II (Contextual Validity). High priority failure.
        // If ECVM_PERMISSIBLE is not explicitly true, mark high failure.
        if (this.artifacts.ECVM_PERMISSIBLE !== true) {
            const trace = this.logs.SGS || 'N/A';
            this.candidates.push({
                axiom: Axioms.GAX_II,
                artifact: "ECVM (Execution Context Validation Map)",
                trace: trace,
                severity: Severities.HIGH
            });
            
            // Only set status if a higher priority GAX hasn't already been identified
            if (!this.reportStatus.startsWith("FAILURE_GAX_III")) {
                this.reportStatus = "FAILURE_GAX_II";
            }
        }
    }

    _checkGaxI() {
        // Checks for GAX I (Utility Efficacy). Medium priority failure.
        
        const minOmega = this.artifacts.OMEGA_MIN !== undefined ? this.artifacts.OMEGA_MIN : 1;
        const currentTemm = this.artifacts.TEMM_VALUE !== undefined ? this.artifacts.TEMM_VALUE : 0;

        if (currentTemm < minOmega) {
            const trace = this.logs.ADTM || 'N/A';
            this.candidates.push({
                axiom: Axioms.GAX_I,
                artifact: "TEMM (Transition Efficacy Measure)",
                trace: trace,
                severity: Severities.MEDIUM
            });

            // Only update status if no other failure has been marked.
            if (this.reportStatus === 'SUCCESS_NO_HALT_EVIDENCE') {
                this.reportStatus = "FAILURE_GAX_I";
            }
        }
    }

    /**
     * Executes RCA by running ordered GAX checks.
     * @returns {Object} The analysis report.
     */
    runAnalysis() {
        
        // Rule evaluation ordered by critical priority
        this._checkGaxIII();
        this._checkGaxII();
        this._checkGaxI();

        // Final status determination
        if (this.reportStatus === "SUCCESS_NO_HALT_EVIDENCE" && this.candidates.length > 0) {
             this.reportStatus = "FAILURE_UNCORRELATED";
        }
        
        // If no candidates found and system ran successfully, report clean success
        if (this.candidates.length === 0 && this.reportStatus !== "FAILURE_UNCORRELATED") {
            this.reportStatus = "SUCCESS_SYSTEM_CLEAN";
        }

        return {
            status: this.reportStatus,
            gsepStage: this.initialStage,
            rootCauseCandidates: this.candidates
        };
    }
}

module.exports = {
    DSEIntegrityAnalyzer,
    Axioms,
    Severities
};
