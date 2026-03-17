import fs from 'fs';
import path from 'path';

const CDSM_PATH = path.join(process.cwd(), 'governance', 'CDSM.json');

/**
 * The Decision Engine calculates proposal acceptance scores based on 
 * weighted metrics and risk profiles defined in the CDSM.
 */
class DecisionEngine {
    constructor() {
        // Load matrix synchronously upon initialization, mimicking the original Python implementation.
        this.matrix = this._loadCDSM();
        this.weights = this.matrix?.decision_weights || {};
        if (!this.matrix) {
            console.error("[DECISION_ENGINE] Initialized without valid CDSM data.");
        }
    }

    _loadCDSM() {
        try {
            // Assumption: This runs relative to the execution context where UNIFIER.js is run.
            const data = fs.readFileSync(CDSM_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.error(`[DECISION_ENGINE] CDSM not found at ${CDSM_PATH}.`);
            } else {
                console.error(`[DECISION_ENGINE] Error loading CDSM: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Calculates the final acceptance score for a proposal based on CDSM weights.
     */
    calculateProposalScore(proposalMetrics, riskProfile) {
        if (!this.matrix || !this.matrix.risk_profiles) return 0.0;

        const riskConfig = this.matrix.risk_profiles[riskProfile] || { severity_score: 1.0 };
        
        const w_TestConfidence = this.weights.Weighted_Test_Confidence || 0;
        const w_RiskSeverity = this.weights.Risk_Severity_Multiplier || 0;
        const w_AlignmentScore = this.weights.Architectural_Alignment_Score || 0;

        const testConfidence = (proposalMetrics.test_confidence || 0.0) * w_TestConfidence;
        // Risk impact calculation: (1 - severity_score) * multiplier
        const riskImpact = (1 - riskConfig.severity_score) * w_RiskSeverity;
        const architectureAlignment = (proposalMetrics.alignment_score || 0.0) * w_AlignmentScore;

        const finalScore = testConfidence + riskImpact + architectureAlignment;
        return parseFloat(finalScore.toFixed(4));
    }

    /**
     * Determines the automated action based on the score and risk profile.
     */
    determineAction(score, riskProfile) {
        if (!this.matrix || !this.matrix.decision_thresholds) {
             return { status: "ERROR", action: "System_Configuration_Failure" };
        }
        
        const thresholds = this.matrix.decision_thresholds;
        const riskConfig = this.matrix.risk_profiles[riskProfile] || {};
        
        if (score >= thresholds.Accept_Autonomous) {
            return { status: "ACCEPTED", action: "Proceed_to_Deployment" };
        } 
        
        const requiredMinConfidence = riskConfig.required_confidence_min || 0.0;

        if (score >= thresholds.Quorum_Required && score >= requiredMinConfidence) {
            return { status: "QUORUM_VOTE", action: "Initiate_Quorum_Review" };
        }
        
        // Default to human mandatory review or optimization refactor
        const fallbackAction = this.matrix.fallback_strategies?.default_low_score_action || "Require_Human_Review";
        return { status: "REJECTED", action: fallbackAction };
    }

    /**
     * Main evaluation entry point.
     */
    evaluate(proposalData) {
        const score = this.calculateProposalScore(proposalData.metrics, proposalData.risk_profile);
        const action = this.determineAction(score, proposalData.risk_profile);
        // Logging converted from Python's logging module to Node's console.log
        console.log(`[DECISION_ENGINE] Proposal Score: ${score}, Determined Action: ${action.action}`);
        return action;
    }
}

export default DecisionEngine;