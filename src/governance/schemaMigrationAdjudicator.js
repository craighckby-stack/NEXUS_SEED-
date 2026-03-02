// Schema Migration Adjudicator (SMA) V99.0 - Policy-Driven Decoupling
// GSEP Stage 2/3 Interlock: Ensures state schema integrity during architectural mutation.

import { ASR } from './architectureSchemaRegistrar.js';
import { MCR } from './mutationChainRegistrar.js';
import { MPSE } from './mutationPayloadSpecEngine.js'; 
import { SMSE } from './schemaMigrationSimulationEngine.js'; 
import { D_01 } from '../core/decisionAuditLogger.js';
import { GPE } from './governancePolicyEngine.js'; // NEW: Governance Policy Engine

/**
 * The SMA validates proposed schema changes within the M-02 payload against the
 * system state (MCR) and mandated contracts (ASR). It fetches dynamic governance
 * parameters from GPE, delegates simulation to SMSE, integrates results, and 
 * determines final acceptance.
 */
export class SchemaMigrationAdjudicator {
    
    /**
     * Policy parameters loaded from GPE at runtime startup.
     * @private
     * @readonly
     */
    static GOVERNANCE_CONFIG = GPE.getSMAParams();

    constructor() {
        // Stateless Adjudicator. Dependencies are module imports.
    }

    /**
     * Executes the formal schema compatibility check.
     * @param {object} m02Payload - The Mutation Payload (contains the proposed new schema definitions).
     * @returns {Promise<{compatibilityScore: number, migrationPlanValidated: boolean, requiredRollbackProcedure: string}>}
     */
    async adjudicate(m02Payload) {
        const { WEIGHTS, THRESHOLDS } = SchemaMigrationAdjudicator.GOVERNANCE_CONFIG;

        // --- 0. Payload Pre-Validation & Structure Check ---
        try {
            // Utilize defensive checking around MPSE utility
            if (!MPSE.validateM02Structure || !MPSE.validateM02Structure(m02Payload)) {
                await D_01.logFailure('SMA', 'M-02 payload failed structural validation against specs or MPSE utility unavailable.');
                return this._vetoResult('Structural Veto: Payload Format Invalid');
            }
        } catch (error) {
            await D_01.logFailure('SMA', `MPSE validation failed critically: ${error.message}`);
            return this._vetoResult('Structural Veto: Validation Engine Failure');
        }

        const proposedSchema = m02Payload.architecturalSchema;
        if (!proposedSchema) {
            return this._vetoResult('Structural Veto: Missing Schema Definition');
        }

        const currentSchemaHash = MCR.getCurrentSchemaHash(); 

        // --- 1. Contract Compliance Check (ASR) ---
        const contractCompliance = await ASR.validateSchemaCompliance(proposedSchema);
        if (contractCompliance.score < 0.01) {
            await D_01.logFailure('SMA', 'Proposed schema failed architectural contract compliance checks (ASR).');
            return this._vetoResult('Policy Veto: Contract Breach');
        }

        // --- 2. Deep Simulation (SMSE Delegation) ---
        const diffAnalysis = await SMSE.runDeepSchemaDiff(currentSchemaHash, proposedSchema);
        const migrationIntegrityResult = await SMSE.simulateMigrationPath(diffAnalysis, proposedSchema);

        // --- 3. Final Adjudication Score Calculation ---
        const compatibilityScore = this._calculateCompatibilityScore(
            contractCompliance.score,
            migrationIntegrityResult.integrity,
            WEIGHTS
        );

        // --- 4. Decision & Validation ---
        // Must meet MINIMUM_ACCEPTANCE to proceed, and VALIDATION threshold for full confidence.
        const migrationAccepted = compatibilityScore >= THRESHOLDS.MINIMUM_ACCEPTANCE;
        const migrationValidated = compatibilityScore >= THRESHOLDS.VALIDATION;

        if (!migrationAccepted) {
            await D_01.logWarning('SMA', `Rejected. Score: ${compatibilityScore.toFixed(4)} (Minimum: ${THRESHOLDS.MINIMUM_ACCEPTANCE}). Reason: Insufficient Score.`);
            return this._vetoResult('Score Veto: Minimum Threshold Not Met');
        } else {
             await D_01.logSuccess('SMA', `Schema Accepted. Score: ${compatibilityScore.toFixed(4)}. Validation Status: ${migrationValidated ? 'Validated' : 'Accepted (Waivered)'}`);
        }

        return {
            compatibilityScore: compatibilityScore,
            migrationPlanValidated: migrationValidated,
            requiredRollbackProcedure: migrationIntegrityResult.rollbackPlanHash
        };
    }
    
    /**
     * Utility method to standardize score aggregation based on dynamic weights.
     * @private
     * @param {number} contractScore
     * @param {number} integrityScore
     * @param {object} weights - Dynamic weight map.
     * @returns {number}
     */
    _calculateCompatibilityScore(contractScore, integrityScore, weights) {
        return (contractScore * weights.CONTRACT_COMPLIANCE) +
               (integrityScore * weights.MIGRATION_INTEGRITY);
    }

    /**
     * Standardizes the immediate veto response structure.
     * @private
     * @param {string} reason 
     * @returns {{compatibilityScore: number, migrationPlanValidated: boolean, requiredRollbackProcedure: string}}
     */
    _vetoResult(reason) {
        return { 
            compatibilityScore: 0.0, 
            migrationPlanValidated: false, 
            requiredRollbackProcedure: reason 
        };
    }
}