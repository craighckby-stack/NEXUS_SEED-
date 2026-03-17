/**
 * PolicyValidationModule (PVM)
 * Checks system actions and proposed decisions against Governance Threshold Configuration Manifest (GTCM) constraints.
 * This module acts as the crucial runtime guardrail.
 * 
 * Optimization Directive: Refactored for abstract, iterative validation to maximize computational efficiency and scalability.
 */
export class PolicyValidationModule {
    
    /**
     * @param {object} gtcmConfig - The Governance Threshold Configuration Manifest.
     */
    constructor(gtcmConfig) {
        if (!gtcmConfig || !gtcmConfig.constraints) {
            throw new Error("PVM initialization requires valid GTCM constraints structure.");
        }
        // Pre-compile the constraints into a flattened, iterable structure for runtime efficiency.
        this.compiledConstraints = this._compileConstraints(gtcmConfig.constraints);
    }

    /**
     * Flattens and parses the constraints configuration into an optimized array of rules.
     * This enables O(1) lookup during runtime validation compared to nested object traversal.
     * @param {object} constraints - The raw constraint structure (e.g., { THRESHOLD: {}, LIMIT: {} }).
     * @returns {Array<object>} Optimized list of validation rules.
     */
    _compileConstraints(constraints) {
        const compiled = [];
        
        const processGroup = (groupName, constraintsGroup) => {
            if (!constraintsGroup) return;

            for (const [constraintKey, def] of Object.entries(constraintsGroup)) {
                
                // Determine checkType: 'min' requires value >= threshold (Thresholds);
                // 'max' requires value <= threshold (Limits).
                let checkType = constraintKey.endsWith('_min') ? 'min' : 'max';

                if (def.metric && typeof def.value === 'number') {
                    compiled.push({
                        metric: def.metric,
                        checkType: checkType,
                        threshold: def.value,
                        constraintKey: constraintKey,
                        policyGroup: groupName
                    });
                } else {
                     console.warn(`[PVM Compile Warning] Constraint '${constraintKey}' missing required 'metric' or 'value'. Skipped.`);
                }
            }
        };

        // Recursive abstraction over known constraint groups
        processGroup('THRESHOLD', constraints.THRESHOLD);
        processGroup('LIMIT', constraints.LIMIT);
        
        return compiled;
    }

    /**
     * Evaluates a set of runtime metrics against all defined GTCM constraints.
     * Uses O(N) iterative comparison with guaranteed early exit on the first violation.
     * 
     * @param {object} metrics - Runtime metrics to evaluate 
     * @returns {boolean} True if compliant, false otherwise.
     */
    isCompliant(metrics) {
        
        for (const rule of this.compiledConstraints) {
            const metricValue = metrics[rule.metric];

            if (typeof metricValue === 'undefined' || metricValue === null) {
                 console.warn(`[PVM Structural Breach] Required metric '${rule.metric}' missing from evaluation payload.`);
                 return false;
            }

            let isViolation = false;
            let operator = '';

            if (rule.checkType === 'min') {
                // Violation if metricValue < threshold (e.g., utility must be 0.5 or higher)
                if (metricValue < rule.threshold) {
                    isViolation = true;
                    operator = '<';
                }
            } else if (rule.checkType === 'max') {
                // Violation if metricValue > threshold (e.g., exposure must be 0.2 or lower)
                if (metricValue > rule.threshold) {
                    isViolation = true;
                    operator = '>';
                }
            }

            if (isViolation) {
                const description = rule.policyGroup === 'THRESHOLD' 
                    ? `below minimum required threshold` 
                    : `exceeds maximum allowed limit`;

                console.warn(`[PVM Breach: ${rule.constraintKey}] Metric ${rule.metric} (${metricValue}) ${operator} defined limit (${rule.threshold}). Rule: ${description}.`);
                return false; // Maximum efficiency: fail fast
            }
        }

        return true;
    }

    /**
     * Fetches constraint definition using the original structure keys.
     * NOTE: This is implemented as a simple lookup wrapper over the compile structure.
     * (If complex constraints existed, this method would require re-introducing the original raw constraints structure).
     */
    getConstraintDefinition(type, key) {
        return this.compiledConstraints.find(
            rule => rule.policyGroup === type && rule.constraintKey === key
        );
    }
}