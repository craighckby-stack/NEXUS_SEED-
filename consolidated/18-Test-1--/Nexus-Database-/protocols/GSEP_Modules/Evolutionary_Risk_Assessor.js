/**
 * Evolutionary_Risk_Assessor.js
 * 
 * Utility module to analyze proposed code evolutions against GPC risk profiles.
 * 
 * Dependencies: GSEP_Config/GPC.json
 */

import { loadConfig } from '../GSEP_Config/ConfigLoader';

const GPC = loadConfig('GPC');
const { risk_tolerance, target_efficiency_gain_min } = GPC.protocol_evolution_control;

/**
 * Calculates the risk and predicted efficacy of a proposed code change object.
 * @param {object} proposal - The proposed refactoring/scaffolding object.
 * @param {object} currentMetrics - Real-time system performance metrics.
 * @returns {object} - Assessment score and recommendation.
 */
export function assessProposal(proposal, currentMetrics) {
    const estimatedImpact = proposal.metrics.predicted_cpu_reduction; // Example metric
    const codeComplexityChange = proposal.metrics.cyclomatic_change;

    let riskScore = 0;
    let efficacyScore = 0;

    // 1. Efficacy Check: Must meet minimum gain threshold
    if (estimatedImpact >= target_efficiency_gain_min) {
        efficacyScore += 0.6; // High positive weighting
    }

    // 2. Risk Check: Large complexity changes increase risk
    if (codeComplexityChange > 50) {
        riskScore += 0.8;
    }
    
    // 3. Current system stability check (example)
    if (currentMetrics.recent_errors > 0.01) {
        riskScore += 0.5; // Avoid high-risk evolution during instability
    }

    const quantitativeRisk = riskScore / efficacyScore; // simplified score

    // Policy Enforcement based on GPC.risk_tolerance
    let recommendation = "REJECT";
    
    if (risk_tolerance === "HIGH" && quantitativeRisk < 2.0) {
        recommendation = "APPROVE";
    } else if (risk_tolerance === "MODERATE" && quantitativeRisk < 1.0) {
        recommendation = "APPROVE_CAUTION";
    } else if (quantitativeRisk < 0.5 && estimatedImpact >= target_efficiency_gain_min) {
        recommendation = "APPROVE";
    }

    return {
        risk: quantitativeRisk,
        gain_metric: estimatedImpact,
        recommendation: recommendation,
        reasoning: `Risk tolerance: ${risk_tolerance}. Calculated risk: ${quantitativeRisk.toFixed(2)}.`
    };
}