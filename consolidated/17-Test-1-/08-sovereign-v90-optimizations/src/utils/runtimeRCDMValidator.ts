import RCDM from '../config/RCDM.json';

/**
 * Interface representing the standardized result from the RCDMStructuralValidator tool.
 */
interface ValidationResult {
    success: boolean;
    errors: string[];
}

/**
 * Executes the RCDM validation against the loaded configuration using the 
 * specialized kernel validator tool (RCDMStructuralValidator).
 * 
 * NOTE: This function simulates a synchronous call to the kernel validation utility.
 * In a production kernel, this would be replaced by the direct tool invocation API.
 * 
 * @param data The RCDM configuration object to validate.
 * @returns The validation result.
 * @internal
 */
function invokeRCDMValidator(data: any): ValidationResult {
    // AGI_KERNEL_TOOL_INVOCATION: RCDMStructuralValidator.execute({ data: RCDM })
    
    // --- START Mock Implementation to maintain type checking structure ---
    // The actual execution happens via the kernel plugin interface.
    
    const VALID_RECOURSE_ACTIONS = ['HALT_AND_QUARANTINE', 'ABORT_INFERENCE_PATH', 'LOG_VETO_PROPAGATE'];
    const VALID_LAYERS = ['L0_KERNEL_SAFEGUARD', 'L1_CORE_PROCESS', 'L2_ADAPTIVE_LAYER'];

    const isValidString = (value: any): boolean => typeof value === 'string' && value.length > 0;

    const validateConstraintDefinition = (def: any, key: string): string[] => {
        let errors: string[] = [];

        if (!isValidString(def.DESCRIPTION)) errors.push(`[${key}] DESCRIPTION must be a non-empty string.`);
        if (!isValidString(def.METRIC_ID)) errors.push(`[${key}] METRIC_ID must be a non-empty string.`);
        if (!VALID_LAYERS.includes(def.LAYER)) errors.push(`[${key}] LAYER is invalid: ${def.LAYER}`);
        if (def.UNIT !== undefined && typeof def.UNIT !== 'string') errors.push(`[${key}] UNIT must be a string if present.`);
        if (!VALID_RECOURSE_ACTIONS.includes(def.RECOURSE_ACTION)) errors.push(`[${key}] RECOURSE_ACTION is invalid: ${def.RECOURSE_ACTION}`);

        if (def.THRESHOLD_TYPE === 'MINIMUM' || def.THRESHOLD_TYPE === 'MAXIMUM') {
            if (typeof def.VALUE !== 'number' || isNaN(def.VALUE)) errors.push(`[${key}] Numeric constraint requires a numeric VALUE.`);
        } else if (def.THRESHOLD_TYPE === 'BOOLEAN_MANDATE') {
            if (typeof def.VALUE !== 'boolean') errors.push(`[${key}] Boolean constraint requires a boolean VALUE.`);
        } else {
            errors.push(`[${key}] Invalid THRESHOLD_TYPE: ${def.THRESHOLD_TYPE}`);
        }
        return errors;
    };

    const validateRCDMStructure = (rcdm: any): string[] => {
        let issues: string[] = [];

        // 1. Check RCDM_VERSION
        if (!isValidString(rcdm?.RCDM_VERSION)) {
            issues.push("RCDM_VERSION must be a non-empty string.");
        } else {
            const versionRegex = /^v\d+\.\d+(\.\d+)?$/;
            if (!versionRegex.test(rcdm.RCDM_VERSION)) {
                issues.push(`Invalid RCDM version format: ${rcdm.RCDM_VERSION} (must be vX.Y.Z)`);
            }
        }

        // 2. Check CRITICAL_SAFETY_CONSTRAINTS
        const constraints = rcdm?.CRITICAL_SAFETY_CONSTRAINTS;
        if (typeof constraints !== 'object' || constraints === null || Array.isArray(constraints)) {
            issues.push("CRITICAL_SAFETY_CONSTRAINTS must be an object (record).");
        } else {
            for (const key in constraints) {
                if (Object.prototype.hasOwnProperty.call(constraints, key)) {
                    const def = constraints[key];
                    if (!isValidString(key)) {
                        issues.push("Constraint keys must be non-empty strings.");
                        continue;
                    }
                    if (typeof def !== 'object' || def === null) {
                        issues.push(`Constraint definition for key '${key}' is not an object.`);
                        continue;
                    }
                    issues = issues.concat(validateConstraintDefinition(def, key));
                }
            }
        }
        return issues;
    };
    
    const errors = validateRCDMStructure(data); 
    return { success: errors.length === 0, errors: errors };
    // --- END Mock Implementation ---
}


/**
 * Validates the loaded RCDM configuration against the structural requirements 
 * using the specialized kernel validator tool.
 * Essential for L0/L1 safety assurance during system initialization.
 */
export function validateRCDMConfiguration(): void {
    console.log("RCDM: Running runtime configuration validation...");
    
    // The validation logic is delegated to the RCDMStructuralValidator plugin, 
    // ensuring loose coupling and portability away from third-party libraries.
    const validationResult = invokeRCDMValidator(RCDM);
    
    if (validationResult.success) {
        console.log("RCDM: Configuration validated successfully.");
    } else {
        console.error("RCDM VALIDATION FAILED! Critical startup constraint violation detected.");
        // Output structured errors for debugging
        console.error(JSON.stringify(validationResult.errors, null, 2));
        
        // Immediate halting is crucial for safety constraints
        process.exit(1);
    }
}
