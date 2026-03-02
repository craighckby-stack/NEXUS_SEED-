import RCDM_RAW from './RCDM.json';

type RecourseAction = "HALT_AND_QUARANTINE" | "ABORT_INFERENCE_PATH" | "LOG_VETO_PROPAGATE";
type ConstraintLayer = "L0_KERNEL_SAFEGUARD" | "L1_CORE_PROCESS" | "L2_ADAPTIVE_LAYER";
type ThresholdType = 'MINIMUM' | 'MAXIMUM' | 'BOOLEAN_MANDATE' | 'EXACT';

/** Runtime Value used for evaluation */
type ObservedValue = number | boolean;
/** Target value defined in RCDM */
type TargetValue = number | boolean;

interface ConstraintDefinition {
    DESCRIPTION: string;
    METRIC_ID: string;
    LAYER: ConstraintLayer;
    THRESHOLD_TYPE: ThresholdType;
    VALUE: TargetValue;
    UNIT?: string;
    RECOURSE_ACTION: RecourseAction;
}

interface RCDMConstraintData {
    [key: string]: ConstraintDefinition;
}

// Interface mirroring the expected structure of RCDM.json
export interface RCDMFileStructure {
    RCDM_VERSION: string;
    CRITICAL_SAFETY_CONSTRAINTS: RCDMConstraintData;
}

export interface EnforcementResult {
    passed: boolean;
    action: RecourseAction | null;
    violationDetails?: {
        constraintId: string;
        observedValue: ObservedValue;
        expectedValue: TargetValue;
        thresholdType: ThresholdType;
        layer: ConstraintLayer;
    };
}

/**
 * Manages loading and deterministic enforcement of RCDM safety constraints.
 * Refactored to centralize evaluation logic, enforce stricter typing, and improve robustness.
 */
export class ConstraintEnforcementEngine {
    private constraints: RCDMConstraintData;
    private readonly version: string;

    /**
     * Initializes the engine, consuming the RCDM data model.
     * Assumes the RCDM structure has been pre-validated if provided externally.
     */
    constructor(initialConstraints: RCDMFileStructure = RCDM_RAW as unknown as RCDMFileStructure) {
        if (!initialConstraints || !initialConstraints.CRITICAL_SAFETY_CONSTRAINTS) {
            throw new Error("RCDM Initialization Failure: Constraint data is missing or malformed.");
        }
        this.constraints = initialConstraints.CRITICAL_SAFETY_CONSTRAINTS;
        this.version = initialConstraints.RCDM_VERSION;
        console.log(`Constraint Enforcement Engine v${this.version} activated with ${Object.keys(this.constraints).length} constraints.`);
    }

    /**
     * Internal helper to determine if the constraint mandates a numerical comparison.
     */
    private isNumericalConstraint(type: ThresholdType): boolean {
        return type === 'MINIMUM' || type === 'MAXIMUM' || type === 'EXACT';
    }

    /**
     * Internal helper to deterministically evaluate observed value against the constraint definition.
     */
    private evaluate(constraint: ConstraintDefinition, observedValue: ObservedValue): boolean {
        const expectedValue = constraint.VALUE;
        const thresholdType = constraint.THRESHOLD_TYPE;

        if (thresholdType === 'BOOLEAN_MANDATE') {
            return observedValue === expectedValue;
        }

        if (!this.isNumericalConstraint(thresholdType)) {
            // Should not happen if types are enforced, but acts as a fallback for unknown types.
            return false;
        }

        // Type Coherence Check for Numerical Constraints
        if (typeof observedValue !== 'number' || typeof expectedValue !== 'number') {
             console.error(`Type mismatch detected for numerical constraint ${constraint.METRIC_ID}. Observed type: ${typeof observedValue}. Expected type: number.`);
             // Violation must occur if types are inconsistent in numerical checks.
             return false;
        }

        switch (thresholdType) {
            case 'MINIMUM':
                return observedValue >= expectedValue;
            case 'MAXIMUM':
                return observedValue <= expectedValue;
            case 'EXACT':
                // Using triple equals for strict equality for numerical constraints
                return observedValue === expectedValue;
            default:
                // Defensive programming: Catch new, unhandled threshold types
                return false;
        }
    }

    /**
     * Validates a provided metric value against a specific RCDM constraint.
     *
     * @param constraintId The ID of the constraint.
     * @param observedValue The runtime metric value (number or boolean).
     * @returns EnforcementResult detailing status, action, and context of violation if failed.
     */
    public enforce(constraintId: keyof RCDMConstraintData, observedValue: ObservedValue): EnforcementResult {
        const constraint = this.constraints[constraintId];

        if (!constraint) {
            console.error(`Attempted enforcement on unknown Constraint ID: ${String(constraintId)}. Skipping enforcement.`);
            // Safest default is non-enforcement if the configuration is missing.
            return { passed: true, action: null };
        }

        const enforcementPassed = this.evaluate(constraint, observedValue);

        if (!enforcementPassed) {
            const violationDetails = {
                constraintId: String(constraintId),
                observedValue: observedValue,
                expectedValue: constraint.VALUE,
                thresholdType: constraint.THRESHOLD_TYPE,
                layer: constraint.LAYER
            };

            // Centralized structured warning for downstream telemetry hooks
            console.warn(`[RCDM VIOLATION L${constraint.LAYER}] ID:${String(constraintId)}. Action: ${constraint.RECOURSE_ACTION}. Observed: ${observedValue}. Expected: ${constraint.THRESHOLD_TYPE} ${constraint.VALUE}`);

            return { 
                passed: false, 
                action: constraint.RECOURSE_ACTION, 
                violationDetails 
            };
        }

        return { passed: true, action: null };
    }

    /**
     * Public access to constraint definitions (e.g., for reporting or dynamic UI generation).
     */
    public getConstraintDefinition(constraintId: keyof RCDMConstraintData): ConstraintDefinition | undefined {
        return this.constraints[constraintId];
    }
}
