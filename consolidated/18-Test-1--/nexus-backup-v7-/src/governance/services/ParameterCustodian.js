/**
 * ParameterCustodianKernel: High-integrity, asynchronous service responsible for 
 * read, validation, and atomic mutation of core governance parameters.
 * It enforces SecurityThresholds and checks ComplexityGrowthLimitPerCycle via the
 * IGovernanceConstraintEvaluatorToolKernel, strictly adhering to AIA mandates 
 * for non-blocking I/O and maximum recursive abstraction.
 */

import { GovernanceSettingsRegistryKernel } from "./GovernanceSettingsRegistryKernel";
import { IGovernanceConstraintEvaluatorToolKernel } from "./IGovernanceConstraintEvaluatorToolKernel";
import { MultiTargetAuditDisperserToolKernel } from "./MultiTargetAuditDisperserToolKernel";
import { HashIntegrityCheckerToolKernel } from "./HashIntegrityCheckerToolKernel";

class ParameterCustodianKernel {
    
    // Mandatory initialization interface
    async initialize(): Promise<void> {
        // Dependencies are initialized externally by the AGI-KERNEL loader.
        // We rely on the GovernanceSettingsRegistryKernel to have loaded the initial state.
    }

    constructor(
        private governanceSettingsRegistryKernel: GovernanceSettingsRegistryKernel,
        private constraintEvaluatorKernel: IGovernanceConstraintEvaluatorToolKernel,
        private auditDisperserKernel: MultiTargetAuditDisperserToolKernel,
        private hashIntegrityCheckerKernel: HashIntegrityCheckerToolKernel
    ) {}

    /**
     * Utility to fetch deeply nested parameters asynchronously.
     * Delegates entirely to the GovernanceSettingsRegistryKernel.
     */
    async read(keyPath: string): Promise<any> {
        // GovernanceSettingsRegistryKernel handles the asynchronous retrieval and path parsing
        return this.governanceSettingsRegistryKernel.get(keyPath);
    }

    /**
     * Validates a proposed parameter mutation against defined governance constraints.
     * Delegates complex constraint checking to the specialized ConstraintEvaluator Kernel.
     */
    async validateMutation(proposedParams: any): Promise<void> {
        const currentParams = await this.governanceSettingsRegistryKernel.getAll();
        
        const validationPayload = {
            target: 'GOVERNANCE_PARAMETERS_MUTATION',
            current: currentParams,
            proposed: proposedParams
        };

        // The constraint evaluation is complex and must be asynchronous.
        const evaluationResult = await this.constraintEvaluatorKernel.evaluateConstraints(validationPayload);

        if (!evaluationResult.valid) {
            const failureMessages = evaluationResult.details
                .filter(d => d.status === 'FAIL')
                .map(d => `${d.constraintId}: ${d.message}`);

            await this.auditDisperserKernel.recordAudit(
                'GOVERNANCE_PARAM_MUTATION_REJECTED', 
                { reason: 'Constraint Violation', failures: failureMessages, proposedParams },
                'HIGH_RISK'
            );

            throw new Error(`Mutation failed governance constraints: ${failureMessages.join(' | ')}`);
        }
    }

    /**
     * Commits the validated parameters, persisting the state atomically.
     * Delegates state persistence entirely to the GovernanceSettingsRegistryKernel.
     */
    async commit(proposedParams: any): Promise<void> {
        // 1. Re-validate immediately before commit (ensuring atomicity and external state freshness)
        await this.validateMutation(proposedParams);
        
        // 2. Delegate the atomic write and internal state update
        await this.governanceSettingsRegistryKernel.updateAll(proposedParams);

        // 3. Generate verifiable hash and record auditable confirmation
        const newParamsHash = await this.hashIntegrityCheckerKernel.hashObject(proposedParams, 'SHA3-512');

        await this.auditDisperserKernel.recordAudit(
            'GOVERNANCE_PARAM_MUTATION_SUCCESS', 
            { newParamsHash, details: 'Core governance parameters updated successfully.' },
            'NORMAL'
        );
    }
}

module.exports = ParameterCustodianKernel;
