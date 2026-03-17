/**
 * CIM Governance Codes v94.1
 * Provides centralized storage for system constants, critical target definitions,
 * and governance error codes related to the Configuration Integrity Monitor (CIM).
 */

// Defines the critical configuration files that MUST be integrity monitored.
const CRITICAL_TARGETS = Object.freeze([
    'config/governance.yaml', 
    'config/veto_mandates.json',
    'config/security_policies.json' // Added mandatory third target for improved security posture
]);

// Defines internal error and event codes for strict traceability.
const CIM_CODES = Object.freeze({
    // Initialization and State Codes
    INIT_FAILURE: 'E941A',
    UNINITIALIZED_ACCESS: 'E941B',
    LEDGER_INTERFACE_MISSING: 'E941C',
    INIT_VETO: 'CIM_INIT_VETO',
    INIT_FATAL: 'CIM_INIT_FATAL',
    
    // Integrity Veto Codes (Security Policy Enforcement)
    UNTRACKED_VETO: 'D941C', // Configuration path is untracked.
    MUTATION_VETO: 'D941D', // Hash mismatch detected.

    // Update/Commit Codes
    UPDATE_VETO: 'E941E', // Update rejected (A-01 validation failure).
    D01_COMMIT_FAILURE: 'D01_COMMIT_FAILURE'
});

module.exports = {
    CRITICAL_TARGETS,
    CIM_CODES
};