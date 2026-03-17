const KNOWN_PHASE_TYPES = new Set([
    "EXECUTION", 
    "PREP_CHECK", 
    "ATOMIC_VALIDATION", 
    "COMMIT_ANCHOR"
]);

/**
 * Ensures the list of GSEP phases adheres to structural, sequential, 
 * and type constraints before execution begins.
 * 
 * This utility formalizes the checks performed preliminarily by the Orchestrator, 
 * providing a clear separation of configuration management and runtime execution.
 * @param {Array<Object>} phases - The list of GSEP phase configurations.
 * @returns {Array<Object>} The validated phases list.
 * @throws {Error} If configuration constraints are violated (using generic Error assuming upstream handling).
 */
export function validateGSEPConfig(phases) {
    const requiredKeys = ['target', 'agent', 'method', 'type'];
    let lastTarget = 0;

    if (!Array.isArray(phases)) {
        throw new Error("GSEPConfigurationError: GSEP configuration must be a list of phases.");
    }

    for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        const phaseLabel = `Phase Index ${i}`;
        
        // 1. Structural Check
        const missing = requiredKeys.filter(key => !(key in phase));
        if (missing.length > 0) {
            throw new Error(`GSEPConfigurationError: ${phaseLabel}: Missing required keys: ${missing.join(', ')}`);
        }

        // 2. Target Sequential Check (Ensures linearity)
        const target = phase.target;
        
        // Check if target is an integer and sequentially increasing
        if (typeof target !== 'number' || !Number.isInteger(target) || target <= lastTarget) {
            throw new Error(`GSEPConfigurationError: ${phaseLabel}: Target stage '${target}' is not sequentially increasing or is not an integer. Must be > ${lastTarget}.`);
        }
        lastTarget = target;

        // 3. Type Check (Ensures adherence to GSEP standards)
        const phaseType = phase.type;
        if (!KNOWN_PHASE_TYPES.has(phaseType)) {
             throw new Error(`GSEPConfigurationError: ${phaseLabel}: Unknown phase type: '${phaseType}'. Known types are ${Array.from(KNOWN_PHASE_TYPES).join(', ')}`);
        }
    }

    return phases;
}