import { IGovernanceRuleDefinitionsRegistryKernel } from "../policy/IGovernanceRuleDefinitionsRegistryKernel";
import { MultiTargetAuditDisperserToolKernel } from "../auditing/MultiTargetAuditDisperserToolKernel";
import { MutationPayloadSpecKernel } from "../validation/MutationPayloadSpecKernel";
import { PreCommitSimulationRunnerKernel } from "../simulation/PreCommitSimulationRunnerKernel";
import { IConceptualPolicyEvaluatorKernel } from "../policy/IConceptualPolicyEvaluatorKernel";
import { GovernanceSettingsRegistryKernel } from "../config/GovernanceSettingsRegistryKernel";
import { ITraceableIdGeneratorToolKernel } from "../utilities/ITraceableIdGeneratorToolKernel";
import { ActiveStateContextManagerKernel } from "../state/ActiveStateContextManagerKernel";

/**
 * AGI-KERNEL: SchemaMigrationAdjudicatorKernel (SMAK)
 * Refactored from the synchronous SchemaMigrationAdjudicator (SMA).
 * 
 * This Kernel orchestrates asynchronous validation, simulation, scoring, and policy enforcement
 * for proposed schema mutations (M-02 payloads), strictly adhering to AIA Enforcement Layer
 * mandates for non-blocking execution and Maximum Recursive Abstraction.
 */
export class SchemaMigrationAdjudicatorKernel {
    
    private config: any;
    private initialized: boolean = false;

    constructor(
        private readonly configRegistry: GovernanceSettingsRegistryKernel,
        private readonly auditDisperser: MultiTargetAuditDisperserToolKernel,
        private readonly payloadValidator: MutationPayloadSpecKernel,
        private readonly simulationRunner: PreCommitSimulationRunnerKernel,
        private readonly policyEvaluator: IConceptualPolicyEvaluatorKernel,
        private readonly stateManager: ActiveStateContextManagerKernel,
        private readonly idGenerator: ITraceableIdGeneratorToolKernel
    ) {}

    /**
     * Initializes the Kernel by asynchronously loading necessary configuration parameters.
     * @throws {Error} If configuration loading fails.
     */
    public async initialize(): Promise<void> {
        if (this.initialized) return;
        
        // Asynchronously load policy parameters, replacing synchronous GPE call.
        this.config = await this.configRegistry.get('SMA_ADJUDICATION_POLICY');

        if (!this.config?.WEIGHTS || !this.config?.THRESHOLDS) {
            throw new Error("SMAK Initialization Failure: Missing WEIGHTS or THRESHOLDS configuration.");
        }

        this.initialized = true;
    }

    /**
     * Executes the formal schema compatibility check.
     * @param {object} m02Payload - The Mutation Payload (contains the proposed new schema definitions).
     * @returns {Promise<{compatibilityScore: number, migrationPlanValidated: boolean, requiredRollbackProcedure: string}>}
     */
    public async adjudicate(m02Payload: any): Promise<{
        compatibilityScore: number,
        migrationPlanValidated: boolean,
        requiredRollbackProcedure: string
    }> {
        if (!this.initialized) throw new Error("SchemaMigrationAdjudicatorKernel not initialized.");

        const traceId = await this.idGenerator.generateTraceId('SMA-ADJ');
        const { WEIGHTS, THRESHOLDS } = this.config;

        // --- 0. Payload Pre-Validation (Delegated to MutationPayloadSpecKernel) ---
        try {
            const isValid = await this.payloadValidator.validatePayload(m02Payload, 'M02_SCHEMA_MIGRATION_PAYLOAD');
            if (!isValid) {
                await this.auditDisperser.logFailure(traceId, 'SMAK', 'M-02 payload failed structural validation.', { payload: m02Payload });
                return this._vetoResult('Structural Veto: Payload Format Invalid');
            }
        } catch (error) {
            await this.auditDisperser.logFailure(traceId, 'SMAK', `Payload validation failed critically.`, { error: error.message });
            return this._vetoResult('Structural Veto: Validation Engine Failure');
        }

        const proposedSchema = m02Payload.architecturalSchema;
        if (!proposedSchema) {
            return this._vetoResult('Structural Veto: Missing Schema Definition');
        }

        // --- 1. State Retrieval (Delegated to ActiveStateContextManagerKernel) ---
        // Replaces synchronous MCR hash lookup
        const currentSchemaHash = await this.stateManager.getSystemContextHash('ARCHITECTURAL_SCHEMA_HASH'); 
        
        // --- 2. Deep Simulation and Contract Compliance Check (Delegated to PreCommitSimulationRunnerKernel) ---
        // This tool encapsulates ASR validation (Contract Compliance) and SMSE simulation (Migration Integrity).
        const simulationResult = await this.simulationRunner.simulateSchemaMutation({
            currentSchemaHash: currentSchemaHash,
            proposedSchema: proposedSchema,
            traceId: traceId
        });

        // Fail fast if the simulation reported a severe, unrecoverable contract breach or integrity failure.
        if (simulationResult.complianceScore < 0.01) {
            await this.auditDisperser.logFailure(traceId, 'SMAK', 'Proposed schema failed architectural contract compliance checks.', { scores: simulationResult });
            return this._vetoResult('Policy Veto: Contract Breach');
        }

        // --- 3. Final Adjudication Score Calculation (Delegated to IConceptualPolicyEvaluatorKernel) ---
        
        const scoresToAggregate = {
            CONTRACT_COMPLIANCE: simulationResult.complianceScore,
            MIGRATION_INTEGRITY: simulationResult.integrityScore,
        };

        // Replaces internal/external WeightedScoreAggregator utility
        const compatibilityScore = await this.policyEvaluator.aggregateScores(scoresToAggregate, WEIGHTS);

        // --- 4. Decision & Validation ---
        const migrationAccepted = compatibilityScore >= THRESHOLDS.MINIMUM_ACCEPTANCE;
        const migrationValidated = compatibilityScore >= THRESHOLDS.VALIDATION;

        if (!migrationAccepted) {
            await this.auditDisperser.logWarning(
                traceId, 
                'SMAK', 
                `Rejected. Score: ${compatibilityScore.toFixed(4)} (Minimum: ${THRESHOLDS.MINIMUM_ACCEPTANCE}). Reason: Insufficient Score.`
            );
            return this._vetoResult('Score Veto: Minimum Threshold Not Met');
        } else {
             await this.auditDisperser.logSuccess(
                 traceId, 
                 'SMAK', 
                 `Schema Accepted. Score: ${compatibilityScore.toFixed(4)}. Validation Status: ${migrationValidated ? 'Validated' : 'Accepted (Waivered)'}`
            );
        }

        return {
            compatibilityScore: compatibilityScore,
            migrationPlanValidated: migrationValidated,
            requiredRollbackProcedure: simulationResult.rollbackPlanHash
        };
    }
    
    /**
     * Standardizes the immediate veto response structure.
     * @private
     * @param {string} reason 
     * @returns {{compatibilityScore: number, migrationPlanValidated: boolean, requiredRollbackProcedure: string}}
     */
    private _vetoResult(reason: string): {
        compatibilityScore: number,
        migrationPlanValidated: boolean,
        requiredRollbackProcedure: string
    } {
        return { 
            compatibilityScore: 0.0, 
            migrationPlanValidated: false, 
            requiredRollbackProcedure: reason 
        };
    }
}