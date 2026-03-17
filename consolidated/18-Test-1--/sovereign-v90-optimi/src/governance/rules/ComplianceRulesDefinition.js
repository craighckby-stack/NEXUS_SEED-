/**
 * @module ComplianceRulesDefinitionKernel
 * @description Manages the asynchronous loading and registration of all Governance Compliance Rule definitions.
 * This kernel replaces the synchronous 'ComplianceRulesDefinition.js' artifact, ensuring strict
 * adherence to AIA Enforcement Layer mandates for non-blocking I/O and Maximum Recursive Abstraction.
 */
import { IGovernanceRuleDefinitionsRegistryKernel } from "@tool_kernel/IGovernanceRuleDefinitionsRegistryKernel";
import { IRegistryInitializerToolKernel } from "@tool_kernel/IRegistryInitializerToolKernel";

class ComplianceRulesDefinitionKernel {
    /**
     * @param {IGovernanceRuleDefinitionsRegistryKernel} governanceRuleDefinitionsRegistryKernel 
     * @param {IRegistryInitializerToolKernel} registryInitializerToolKernel 
     */
    constructor(
        governanceRuleDefinitionsRegistryKernel,
        registryInitializerToolKernel
    ) {
        // AIA Enforcement: Ensure delegation to specialized kernels.
        if (!governanceRuleDefinitionsRegistryKernel) {
            throw new Error('IGovernanceRuleDefinitionsRegistryKernel is required for configuration delegation.');
        }
        if (!registryInitializerToolKernel) {
            throw new Error('IRegistryInitializerToolKernel is required for asynchronous initialization.');
        }

        this.ruleRegistry = governanceRuleDefinitionsRegistryKernel;
        this.initializer = registryInitializerToolKernel;

        // Defined rule payload (Inferred data structure for compliance rules)
        this.COMPLIANCE_RULE_DEFINITIONS = Object.freeze([
            { id: 'CR_001_INTEGRITY', name: 'MinimumIntegrityScoreCheck', type: 'COMPLIANCE', threshold: 0.95, description: 'Requires computed integrity score above 95%' },
            { id: 'CR_002_POLICY_SCHEMA', name: 'SecurePolicySchemaMandate', type: 'POLICY_VALIDATION', schemaRef: 'PolicyV7.1', description: 'Enforces usage of audited policy schema V7.1' },
            { id: 'CR_003_ROLLBACK_HEALTH', name: 'RollbackAvailabilityCheck', type: 'GOVERNANCE_HEALTH', requiredSystems: ['RollbackToolInterfaces'], description: 'Verifies availability of rollback mechanisms' }
        ]);
    }

    /**
     * @method initialize
     * @description Asynchronously registers all compliance rule definitions using the delegated initializer.
     * This ensures non-blocking configuration loading.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Delegation of complex registration logic to maintain Maximum Recursive Abstraction.
        const registrationPromises = this.COMPLIANCE_RULE_DEFINITIONS.map(definition => 
            this.initializer.register(this.ruleRegistry, definition.id, definition)
        );

        await Promise.all(registrationPromises);
        // Note: Auditable logging of success is implicit via the MultiTargetAuditDisperserToolKernel, 
        // ensuring compliance with control flow mandates.
    }

    /**
     * @method getRuleDefinition
     * @description Retrieves a specific rule definition via the delegated registry kernel.
     * @param {string} ruleId
     * @returns {Promise<object>}
     */
    async getRuleDefinition(ruleId) {
        return this.ruleRegistry.get(ruleId);
    }

    /**
     * @method getAllRuleIds
     * @description Retrieves all registered rule identifiers.
     * @returns {string[]}
     */
    getAllRuleIds() {
        return this.COMPLIANCE_RULE_DEFINITIONS.map(d => d.id);
    }
}

export default ComplianceRulesDefinitionKernel;