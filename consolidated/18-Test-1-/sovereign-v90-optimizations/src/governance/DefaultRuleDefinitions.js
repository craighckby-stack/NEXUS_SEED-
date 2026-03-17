/**
 * AGI-KERNEL Governance Rule Definitions
 * 
 * CRITICAL REFACTOR: Synchronous rule definitions have been migrated to 
 * the asynchronous GovernanceRuleDefinitionsRegistryKernel to comply 
 * with strategic mandate against synchronous configuration export.
 * 
 * All modules dependent on 'DefaultRuleDefinitions' must be updated to
 * retrieve these definitions via the IGovernanceRuleDefinitionsRegistryKernel interface.
 */

// Placeholder export to prevent runtime errors in modules awaiting refactor.
export default [];