/**
 * NOTE: This implementation assumes the surrounding code defines a class
 * 'ConstraintAdherenceValidator' and these methods are part of its prototype.
 */

/**
 * Creates a standard critical violation payload used for immediate systemic failures 
 * (e.g., missing dependencies).
 * 
 * @param {string} code 
 * @param {string} details
 * @param {string} [target='SYSTEM']
 * @returns {{isAdherent: boolean, violations: object[]}}
 */
_createCriticalViolation(code, details, target = 'SYSTEM') {
    // Defining the data structure clearly for immediate failure payloads
    const violationStructure = { 
        code,
        target,
        severity: 'CRITICAL',
        details
    };

    return {
        isAdherent: false,
        violations: [violationStructure]
    };
}

/**
 * Performs critical input and dependency checks necessary before attempting constraint execution.
 * This method extracts the logic for dependency checking (steps 1, 2, 3 of original validate).
 * 
 * @param {string[]} requiredConstraintCodes 
 * @returns {{code?: string, details?: string, service?: object}}
 */
_runCriticalPreflightChecks(requiredConstraintCodes) {
    const SERVICE_KEY = 'ConstraintExecutionService';

    // 1. Input Validation (Data Preparation Check)
    if (!Array.isArray(requiredConstraintCodes) || requiredConstraintCodes.length === 0) {
        return { 
            code: 'INPUT_VALIDATION_ERROR', 
            details: 'Required constraint codes list is invalid (must be a non-empty array).'
        };
    }
    
    // 2. Synergy Service Access (Dependency Retrieval)
    let ConstraintExecutionService = null;
    if (typeof Synergy === 'object' && typeof Synergy.get === 'function') {
        ConstraintExecutionService = Synergy.get(SERVICE_KEY);
    }

    if (!ConstraintExecutionService) {
        return { 
            code: 'KERNEL_SERVICE_UNAVAILABLE', 
            details: `Required synergy service ${SERVICE_KEY} is unavailable.` 
        };
    }

    // 3. Local Dependency Check (Taxonomy Map)
    const { taxonomyMap } = this;
    if (!taxonomyMap || typeof taxonomyMap.get !== 'function') {
        return { 
            code: 'TAXONOMY_MAP_MISSING', 
            details: "Local taxonomy map required for constraint definitions is missing or invalid (this.taxonomyMap)."
        };
    }
    
    // Success path: return the acquired service instance.
    return { service: ConstraintExecutionService };
}

/**
 * Standardizes the output of a single constraint check into a structured violation object or null if adherent.
 * Extracted from validate() to improve method readability and encapsulation.
 * 
 * @param {string} code 
 * @param {object} constraintDef 
 * @param {object | null} adherenceCheck 
 * @param {Error | null} error 
 * @returns {object | null}
 */
_standardizeConstraintResult(code, constraintDef, adherenceCheck, error) {
    // Use destructuring with defaults
    const {
        target_parameter: target = 'N/A',
        severity: defSeverity = 'MAJOR'
    } = constraintDef;

    // A. Runtime Execution Error
    if (error) {
        // Ensuring consistent violation schema by including target parameter
        return {
            code: `${code}_RUNTIME_ERROR`,
            target, 
            severity: 'CRITICAL',
            details: `Unexpected execution error during constraint ${code}: ${error.message}`
        };
    }

    // B. Explicit Constraint Failure
    if (adherenceCheck?.isMet === false) {
        const failureDetails = adherenceCheck.details || `Adherence rule failed for code: ${code}.`;
        return { code, target, severity: defSeverity, details: failureDetails };
    }

    // C. Service Failure / Invalid Response
    if (adherenceCheck === undefined || adherenceCheck === null) {
        return {
            code: `${code}_SERVICE_FAIL`,
            target: target,
            severity: 'CRITICAL',
            details: `Service returned an invalid or null response for constraint check: ${code}`
        };
    }

    return null; // D. Adherent
}


async validate(configuration, requiredConstraintCodes) {
    const VALIDATION_CONTEXT = '[ConstraintAdherenceValidator]';

    // 1. Run Critical Preflight Checks
    const preflightResult = this._runCriticalPreflightChecks(requiredConstraintCodes);

    if (preflightResult.code) {
        // Handle critical failure: Log error (Side effect) and return violation payload (Data assembly)
        console.error(`${VALIDATION_CONTEXT} ${preflightResult.details}`);
        return this._createCriticalViolation(preflightResult.code, preflightResult.details);
    }
    
    // Extract successful dependencies
    const ConstraintExecutionService = preflightResult.service;
    const { taxonomyMap } = this; // Taxonomy check was implicitly successful if we reached here

    // 2. Constraint Execution Loop (Parallelized using Promise.all)
    const validationPromises = requiredConstraintCodes.map(async (code) => {
        const constraintDef = taxonomyMap.get(code);

        if (!constraintDef) {
            console.warn(`${VALIDATION_CONTEXT} Constraint code ${code} not found in taxonomy. Skipping adherence check.`);
            return null; // Skip
        }

        let adherenceCheck = null;
        let executionError = null;

        try {
            // Delegating constraint execution
            adherenceCheck = await ConstraintExecutionService.execute('executeConstraintCheck', constraintDef, configuration);
        } catch (error) {
            // Catches unexpected runtime errors during service execution (Side-effect logging)
            console.error(`${VALIDATION_CONTEXT} Unexpected error executing constraint ${code}:`, error);
            executionError = error;
        }
        
        // Use externalized logic to standardize result
        return this._standardizeConstraintResult(code, constraintDef, adherenceCheck, executionError);
    });

    // Execute all constraints concurrently for performance improvement (IO bound operations)
    const rawResults = await Promise.all(validationPromises);
    
    // Filter out nulls (adherent or skipped constraints)
    const violations = rawResults.filter(result => result !== null);

    return {
        isAdherent: violations.length === 0,
        violations
    };
}