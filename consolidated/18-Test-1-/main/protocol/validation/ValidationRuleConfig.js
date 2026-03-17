/**
 * Constants defining standard types and severity levels for validation rules.
 */
const RuleSeverity = {
    ERROR: 'ERROR',     // Blocks execution/deployment
    WARNING: 'WARNING', // Permitted, but logged for review
    INFO: 'INFO'        // Informational checks
};

const RuleType = {
    COHERENCE: 'COHERENCE', // Checks related entity consistency (e.g., hard/soft limits)
    VERSIONING: 'VERSIONING', // Checks dependency compatibility
    STRUCTURAL: 'STRUCTURAL', // Checks required fields and data format
    POLICY: 'POLICY' // Checks against governance or ethical constraints
};

/**
 * Sovereign AGI Validation Rule Configuration Registry.
 * Defines standard rule structures used for initialization by Validators.
 * Rules must specify an `id`, `type`, `severity`, and the `handlerId` used 
 * by the validation execution engine for lookup and injection.
 */
module.exports = {
    RuleSeverity,
    RuleType,
    
    /**
     * Rules applied to the CHR Generation Specification (`spec`).
     * The `handlerId` should map directly to an exported function/class method
     * in the system's RuleHandler registry.
     */
    chrSpecRules: [
        {
            id: 'spec.memoryLimitCoherence',
            type: RuleType.COHERENCE,
            severity: RuleSeverity.ERROR,
            description: 'Ensure hard memory limit is not below the soft limit set in configuration.',
            targetPath: 'config.memoryLimits', // Indicates the path in the input structure
            handlerId: 'MemoryRuleHandler.checkLimitCoherence'
        },
        {
            id: 'spec.dependencyCompatibility',
            type: RuleType.VERSIONING,
            severity: RuleSeverity.ERROR,
            description: 'Verify all required internal component versions are compatible with the current runtime protocol.',
            targetPath: 'dependencies',
            handlerId: 'SystemRuleHandler.checkRuntimeCompatibility'
        },
        {
            id: 'spec.requiredFieldsExist',
            type: RuleType.STRUCTURAL,
            severity: RuleSeverity.ERROR,
            description: 'Verify core mandatory fields (like Agent ID and Mission Objective) are defined.',
            targetPath: 'metadata',
            handlerId: 'StructuralRuleHandler.checkRequiredFields'
        }
    ],
    
    // Policy and governance rules requiring specialized handlers
    policyRules: []
};