import { ISchemaAnalyzerKernel } from '$/governance/migration/ISchemaAnalyzerKernel';
import { IMigrationCostModelerKernel } from '$/governance/migration/IMigrationCostModelerKernel';
import { IDeterministicHasherToolKernel } from '$/core/integrity/IDeterministicHasherToolKernel';
import { IRollbackPlanGeneratorToolKernel } from '$/governance/migration/IRollbackPlanGeneratorToolKernel';
import { GCM_SnapshotGeneratorInterfaceKernel } from '$/governance/metrics/GCM_SnapshotGeneratorInterfaceKernel';
import { ISimulatedStateValidatorToolKernel } from '$/governance/simulation/ISimulatedStateValidatorToolKernel';
import { IMigrationExecutionSimulatorToolKernel } from '$/governance/simulation/IMigrationExecutionSimulatorToolKernel';

/**
 * Schema Migration Simulation Kernel (SMSK) V4.0 - AIA Compliant
 * Dedicated computational kernel for high-fidelity differential analysis and 
 * stateless transactional simulation of schema transitions, strictly enforcing
 * non-blocking execution and maximum recursive abstraction.
 *
 * This kernel replaces the synchronous SchemaMigrationSimulationEngine utility,
 * conforming to AIA mandates by delegating all heavy computational and I/O tasks
 * to specialized, asynchronous Tool Kernels.
 */
export class SchemaMigrationSimulationKernel {

    /**
     * @param {ISchemaAnalyzerKernel} schemaAnalyzerKernel - Kernel for computing schema differences.
     * @param {IMigrationCostModelerKernel} costModelerKernel - Kernel for predicting resource consumption.
     * @param {IDeterministicHasherToolKernel} hasherTool - Tool for generating cryptographic hashes and unique IDs.
     * @param {IRollbackPlanGeneratorToolKernel} rollbackGeneratorTool - Tool for deriving rollback strategies.
     * @param {GCM_SnapshotGeneratorInterfaceKernel} snapshotGeneratorTool - Tool for setting up synthetic simulation environments.
     * @param {ISimulatedStateValidatorToolKernel} stateValidatorTool - Tool for validating the integrity of simulated states.
     * @param {IMigrationExecutionSimulatorToolKernel} executionSimulatorTool - Tool for simulating the migration transaction.
     */
    constructor(
        schemaAnalyzerKernel,
        costModelerKernel,
        hasherTool,
        rollbackGeneratorTool,
        snapshotGeneratorTool,
        stateValidatorTool,
        executionSimulatorTool
    ) {
        if (!schemaAnalyzerKernel || !costModelerKernel || !hasherTool || !rollbackGeneratorTool || !snapshotGeneratorTool || !stateValidatorTool || !executionSimulatorTool) {
             throw new Error("SMSK V4.0 requires all dependency kernels to ensure audited, non-blocking execution.");
        }

        this.analyzer = schemaAnalyzerKernel;
        this.costModeler = costModelerKernel;
        this.hasher = hasherTool;
        this.rollbackGenerator = rollbackGeneratorTool;
        this.snapshotGenerator = snapshotGeneratorTool;
        this.stateValidator = stateValidatorTool;
        this.executionSimulator = executionSimulatorTool;
    }

    /**
     * Performs an exhaustive, semantic comparison between two schema definitions.
     * @param {Readonly<object>} currentSchema - The actively deployed schema definition structure.
     * @param {Readonly<object>} proposedSchema - The target schema definition structure.
     * @returns {Promise<Readonly<{ 
     *   complexityScore: number, 
     *   breakingChangesCount: number, 
     *   dataTransformationRequired: boolean, 
     *   changedEntities: ReadonlyArray<string>, 
     *   analysisHash: string,
     *   detailedMetrics: Readonly<object>
     * }>>}
     */
    async analyzeDifferential(currentSchema, proposedSchema) {
        // Delegate complex analysis to the asynchronous ISchemaAnalyzerKernel
        const analysisResult = await this.analyzer.computeDelta(currentSchema, proposedSchema);
        
        // Criteria for required transformation remains
        const transformationNeeded = analysisResult.criticalChanges && analysisResult.criticalChanges.some(
            change => change.requiresDataMapping
        );

        // Delegate deterministic hashing to the asynchronous IDeterministicHasherToolKernel
        const analysisHash = await this.hasher.generateHash(analysisResult);

        return Object.freeze({
            complexityScore: analysisResult.metrics.complexity, 
            breakingChangesCount: analysisResult.metrics.breakingChanges, 
            dataTransformationRequired: transformationNeeded,
            changedEntities: Object.freeze(analysisResult.entitiesAffected),
            analysisHash: analysisHash,
            detailedMetrics: Object.freeze(analysisResult.metrics)
        });
    }

    /**
     * Executes a stateless, in-memory simulation of data migration based on the computed difference.
     * All core simulation steps (setup, execution, validation, rollback planning) are delegated.
     * @param {Readonly<object>} diffAnalysis - The detailed output from analyzeDifferential.
     * @param {Readonly<object>} proposedSchema - The target schema definition.
     * @returns {Promise<Readonly<object>>}
     */
    async runSimulation(diffAnalysis, proposedSchema) {
        
        // 1. Setup Mock Environment & Derive Transformation Scripts (replaces _setupMockEnvironment and _getTransformationScripts)
        const { mockSnapshot, transformationScripts } = await this.snapshotGenerator.generateMockEnvironment(diffAnalysis);

        // 2. Execute Theoretical Transition (replaces _executeTheoreticalMigration)
        const simulatedState = await this.executionSimulator.simulate(mockSnapshot, transformationScripts);

        // 3. Validate Resulting State (replaces _validateSimulatedState)
        const validationResult = await this.stateValidator.validate(simulatedState, proposedSchema);
        
        // 4. Compute Rollback Strategy (replaces synchronous RollbackPlanGenerator)
        const rollbackPlan = await this.rollbackGenerator.generatePlan(diffAnalysis, validationResult.score);

        // 5. Predict costs using the dedicated cost modeler kernel.
        const costEstimate = await this.costModeler.estimateCosts(diffAnalysis);

        // 6. Generate high-integrity transaction ID.
        const transactionId = await this.hasher.generateTransactionId(diffAnalysis);

        return Object.freeze({
            simulationIntegrityScore: validationResult.score, 
            migrationDurationEstimateMs: costEstimate.durationMs,
            resourceUsageEstimate: costEstimate.resources,
            simulatedRollbackPlan: rollbackPlan,
            transactionId: transactionId
        });
    }
}