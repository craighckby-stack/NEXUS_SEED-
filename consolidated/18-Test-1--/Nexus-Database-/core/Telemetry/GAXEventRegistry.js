// core/Telemetry/GAXEventRegistry.js
/**
 * Standardized Event Names for the GAX Telemetry Service (Global Autonomous X-System).
 * 
 * Structure: NAMESPACE:SUBDOMAIN:ACTION
 * Ensures consistency, machine readability, effective filtering, and standardized consumption.
 */
const GAXEventRegistry = Object.freeze({
    // ----------------------------------------
    // System Lifecycle (SYS)
    // ----------------------------------------
    SYS_INIT_START: 'SYS:INIT:START',
    SYS_INIT_COMPLETE: 'SYS:INIT:COMPLETE',
    SYS_EXECUTION_START: 'SYS:EXECUTION:START',
    SYS_EXECUTION_END: 'SYS:EXECUTION:END',
    SYS_SHUTDOWN: 'SYS:SHUTDOWN',

    // ----------------------------------------
    // Policy & Verification (PV)
    // ----------------------------------------
    PV_REQUEST_INITIATED: 'PV:REQUEST:INITIATED',
    PV_RULE_CHECK_SUCCESS: 'PV:RULE:CHECK:SUCCESS',
    PV_RULE_CHECK_FAILURE: 'PV:RULE:CHECK:FAILURE',
    PV_ACCESS_DENIED: 'PV:ACCESS:DENIED', // Added: Explicit policy rejection

    // ----------------------------------------
    // Autonomous Evolution (AXIOM)
    // ----------------------------------------
    AXIOM_GENERATION_START: 'AXIOM:GENERATION:START',
    AXIOM_EVOLUTION_STEP_PERFORMED: 'AXIOM:EVOLUTION:STEP_PERFORMED',
    AXIOM_CODE_COMMITTED: 'AXIOM:CODE:COMMITTED',
    AXIOM_CODE_REVERTED: 'AXIOM:CODE:REVERTED',
    AXIOM_TEST_RUN_SUCCESS: 'AXIOM:TEST:RUN_SUCCESS', // Added: Critical for self-correction loops
    AXIOM_TEST_RUN_FAILURE: 'AXIOM:TEST:RUN_FAILURE', // Added

    // ----------------------------------------
    // Planning and Context Management (PLAN)
    // ----------------------------------------
    PLAN_GOAL_DEFINED: 'PLAN:GOAL:DEFINED',
    PLAN_STEP_GENERATED: 'PLAN:STEP:GENERATED',
    PLAN_STEP_COMPLETED: 'PLAN:STEP:COMPLETED', // Added
    PLAN_CONTEXT_RETRIEVAL_START: 'PLAN:CONTEXT:RETRIEVAL_START',
    PLAN_CONTEXT_RETRIEVAL_COMPLETE: 'PLAN:CONTEXT:RETRIEVAL_COMPLETE',

    // ----------------------------------------
    // External API Interaction (API)
    // ----------------------------------------
    API_REQUEST_SENT: 'API:EXTERNAL:REQUEST_SENT', // Added
    API_RESPONSE_RECEIVED: 'API:EXTERNAL:RESPONSE_RECEIVED', // Added
    API_RATE_LIMIT_HIT: 'API:EXTERNAL:RATE_LIMIT_HIT', // Added: Essential for resource management

    // ----------------------------------------
    // Data/Context Storage (DATA)
    // ----------------------------------------
    DATA_CACHE_HIT: 'DATA:CACHE:HIT', // Added
    DATA_CACHE_MISS: 'DATA:CACHE:MISS', // Added
    DATA_STORAGE_WRITE_FAILURE: 'DATA:STORAGE:WRITE_FAILURE', // Added

    // ----------------------------------------
    // System Diagnostics, Errors, and Warnings (DIAG)
    // ----------------------------------------
    DIAG_CONFIGURATION_FAULT: 'DIAG:CONFIGURATION:FAULT',
    DIAG_CONTEXT_RESOLUTION_MISSING: 'DIAG:CONTEXT:RESOLUTION_MISSING',
    DIAG_COMPONENT_FATAL_ERROR: 'DIAG:COMPONENT:FATAL_ERROR',
    DIAG_WARNING_THRESHOLD_EXCEEDED: 'DIAG:WARNING:THRESHOLD_EXCEEDED',

    // ----------------------------------------
    // Telemetry Infrastructure (TEL)
    // ----------------------------------------
    TEL_PUBLISH_SUCCESS: 'TEL:PUBLISH:SUCCESS',
    TEL_PUBLISH_FAILURE: 'TEL:PUBLISH:FAILURE',
    TEL_DATA_DROPPED: 'TEL:DATA:DROPPED'
});

module.exports = GAXEventRegistry;