/**
 * @fileoverview Defines the Triage Rules Engine (TRE) policy map, translating 
 * Impact and Scope classifications into required GTCM Configuration Keys (Fidelity).
 * This structure serves as the core policy lookup for risk assessment.
 * MIGRATED from config/policy/tre_policy_loader.py as part of UNIFIER Protocol integration.
 */

// Keys are formatted as 'impact:scope' for compound policies, or 'impact' for general fallbacks.
const TRE_POLICY_MAP = {
    // 1. Critical Core functions demand the highest fidelity (5)
    'critical:core': 'high_critical',
    
    // 2. Critical integration changes require robust verification (Fidelity 4)
    'critical:integration': 'critical_integration',
    
    // 3. High impact core changes (Fidelity 3)
    'high:core': 'medium_high',
    
    // --- General Impact Fallbacks ---
    'critical': 'medium_high', 
    'high': 'medium_high',     
    'medium': 'medium_default',
    
    // --- Low Fidelity Defaults ---
    'low': 'low_default',
    'unclassified': 'low_default'
};

module.exports = {
    TRE_POLICY_MAP
};