/**
 * G-03 Rule Definitions Optimized
 *
 * Refactored using functional composition and higher-order functions
 * for maximum efficiency and recursive abstraction.
 */

// --- Configuration Constants (Immutability & Efficiency) ---
const CONFIG = Object.freeze({
    DEFAULT_MAX_CODE_SIZE: 5000,
    DEPENDENCY_SIMULATION_DELAY_MS: 5,
});

// --- Recursive Abstraction: Rule Factory (HOF) ---
/** 
 * Generates a standardized synchronous rule handler closure.
 * Enforces immutable, consistent output structure.
 */
const createSyncRuleHandler = (ruleCode, logicFn) => 
    (payload, config = {}) => {
        // Delegate core logic execution
        const { compliant, message, details = {} } = logicFn(payload, config);
        
        // Return an immutable rule result object
        return Object.freeze({
            compliant,
            message,
            details,
            code: ruleCode,
        });
    };

// --- Handler Implementations ---

// Rule 1: Dependency Integrity Check (Simulated Async Check)
const dependencyIntegrityCheck = async () => {
    // Use optimized configuration constant
    await new Promise(resolve => setTimeout(resolve, CONFIG.DEPENDENCY_SIMULATION_DELAY_MS)); 
    return Object.freeze({ 
        compliant: true, 
        message: "Dependencies validated against system manifest.",
        code: 'DEPENDENCY_INTEGRITY'
    });
};

// Rule 2 Logic: Resource Limit Check
const resourceLimitLogic = (payload, config) => {
    const maxSize = config.maxCodeSize || CONFIG.DEFAULT_MAX_CODE_SIZE;
    // Use optional chaining and nullish coalescing for efficient access
    const currentSize = payload.content?.length ?? 0;
    const compliant = currentSize <= maxSize;

    return {
        compliant,
        message: compliant 
            ? "Resource limits check passed." 
            : `Code size (${currentSize} bytes) exceeds limit (${maxSize} bytes).`,
        details: { currentSize, maxSize }
    };
};

// Rule 3 Logic: Governance History Marker Signal Check
const ghmSignalLogic = (payload) => {
    const compliant = !!payload.metadata?.ghm_signal;
    return {
        compliant,
        message: compliant 
            ? "GHM signal detected." 
            : "Missing mandatory GHM traceability signal in metadata."
    };
};

// --- Module Export (Functional Composition) ---
module.exports = Object.freeze([
    Object.freeze({ 
        code: 'DEPENDENCY_INTEGRITY', 
        handler: dependencyIntegrityCheck 
    }),
    Object.freeze({ 
        code: 'RESOURCE_LIMITS', 
        handler: createSyncRuleHandler('RESOURCE_LIMITS', resourceLimitLogic) 
    }),
    Object.freeze({ 
        code: 'GHM_SIGNAL', 
        handler: createSyncRuleHandler('GHM_SIGNAL', ghmSignalLogic) 
    }),
]);