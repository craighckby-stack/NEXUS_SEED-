const VALIDATOR_TOOL_NAME = "RuntimeConstraintValidatorTool";

/**
 * Extracts and validates the KERNEL Tool interface.
 * Throws errors if dependencies are missing or improperly structured.
 * @returns {object} The validated Tool interface.
 * @private
 */
function _getValidatedTool() {
    // 1. Dependency Resolution
    const KERNEL = typeof KERNEL_SYNERGY_CAPABILITIES !== 'undefined' ? KERNEL_SYNERGY_CAPABILITIES : null;
    const Tool = KERNEL?.Tool;

    if (!Tool || typeof Tool.execute !== 'function') {
        throw new Error("Dependency Error: KERNEL_SYNERGY_CAPABILITIES.Tool interface is unavailable or improperly structured.");
    }
    return Tool;
}

/**
 * Internal helper to execute the validation check against the KERNEL Tool interface.
 * Throws errors if execution fails.
 * 
 * @param {object} constraints 
 * @returns {boolean}
 * @private
 */
function _executeValidationCheck(constraints) {
    // 1. Dependency Resolution (Delegated)
    const Tool = _getValidatedTool();

    // 2. Payload Construction
    const payload = {
        toolName: VALIDATOR_TOOL_NAME,
        method: 'validate',
        args: [constraints]
    };

    // 3. Execution
    const result = Tool.execute(payload);
    
    // Standardize result to a strict boolean
    return !!result;
}


/**
 * Validates the local host environment against the strict resource constraints
 * defined in the SEM configuration prior to sandbox initialization.
 * 
 * Delegates actual resource checks (CPU, memory, accelerators) to the 
 * RuntimeConstraintValidatorTool via KERNEL_SYNERGY_CAPABILITIES.
 * 
 * @param {object} constraints - ExecutionEnvironmentConstraints from SEM_config
 * @returns {boolean} True if environment meets constraints.
 */
export function validateRuntime(constraints) {
    const errorPrefix = "[RuntimeValidationEngine]";
    
    try {
        return _executeValidationCheck(constraints);
    } catch (e) {
        // Centralized error reporting, differentiating between dependency and execution failure
        if (e.message.startsWith("Dependency Error")) {
            console.error(`${errorPrefix} CRITICAL DEPENDENCY FAILURE: Cannot delegate runtime validation. ${e.message}`);
        } else {
            console.error(`${errorPrefix} Execution Failed for tool '${VALIDATOR_TOOL_NAME}': ${e.message}`, e);
        }
        return false;
    }
}