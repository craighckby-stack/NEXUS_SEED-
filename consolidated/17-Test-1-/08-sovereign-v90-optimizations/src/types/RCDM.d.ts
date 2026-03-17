export type RecourseAction = "HALT_AND_QUARANTINE" | "ABORT_INFERENCE_PATH" | "LOG_VETO_PROPAGATE";
export type ConstraintLayer = "L0_KERNEL_SAFEGUARD" | "L1_CORE_PROCESS" | "L2_ADAPTIVE_LAYER";

// --- Discriminated Union Setup for Enhanced Type Safety ---
type NumericThresholdType = 'MINIMUM' | 'MAXIMUM';
type BooleanThresholdType = 'BOOLEAN_MANDATE';
export type ThresholdType = NumericThresholdType | BooleanThresholdType;

interface BaseConstraintDefinition {
    DESCRIPTION: string;
    METRIC_ID: string;
    LAYER: ConstraintLayer;
    UNIT?: string;
    RECOURSE_ACTION: RecourseAction;
}

/**
 * Defines constraints where VALUE must be a number.
 */
interface NumericConstraint extends BaseConstraintDefinition {
    THRESHOLD_TYPE: NumericThresholdType;
    VALUE: number;
}

/**
 * Defines constraints where VALUE must be a boolean.
 */
interface BooleanConstraint extends BaseConstraintDefinition {
    THRESHOLD_TYPE: BooleanThresholdType;
    VALUE: boolean;
}

/**
 * A constraint definition guaranteed to be type-safe based on THRESHOLD_TYPE.
 */
export type ConstraintDefinition = NumericConstraint | BooleanConstraint;

export interface RCDMConstraintData {
    [key: string]: ConstraintDefinition;
}

/**
 * Definitive type structure for the RCDM configuration file (RCDM.json).
 */
export interface RCDMFileStructure {
    RCDM_VERSION: string;
    CRITICAL_SAFETY_CONSTRAINTS: RCDMConstraintData;
}

// Augmenting module definition for direct JSON import typing
declare module "./RCDM.json" {
    const RCDM: RCDMFileStructure;
    export default RCDM;
}