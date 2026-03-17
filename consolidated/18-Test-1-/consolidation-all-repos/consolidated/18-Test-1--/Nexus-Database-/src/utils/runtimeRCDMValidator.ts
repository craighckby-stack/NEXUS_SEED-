import { z } from 'zod';
import RCDM from '../config/RCDM.json';

// 1. Core Literal Definitions (Mirrors RCDM.d.ts for validation)
const RecourseActionSchema = z.union([
    z.literal('HALT_AND_QUARANTINE'),
    z.literal('ABORT_INFERENCE_PATH'),
    z.literal('LOG_VETO_PROPAGATE'),
]);

const ConstraintLayerSchema = z.union([
    z.literal('L0_KERNEL_SAFEGUARD'),
    z.literal('L1_CORE_PROCESS'),
    z.literal('L2_ADAPTIVE_LAYER'),
]);

// 2. Constraint Definition Schemas (Discriminated)
const numericConstraint = z.object({
    DESCRIPTION: z.string().nonempty(),
    METRIC_ID: z.string().nonempty(),
    LAYER: ConstraintLayerSchema,
    UNIT: z.string().optional(),
    RECOURSE_ACTION: RecourseActionSchema,
    THRESHOLD_TYPE: z.union([z.literal('MINIMUM'), z.literal('MAXIMUM')]),
    VALUE: z.number(),
});

const booleanConstraint = z.object({
    DESCRIPTION: z.string().nonempty(),
    METRIC_ID: z.string().nonempty(),
    LAYER: ConstraintLayerSchema,
    UNIT: z.string().optional(),
    RECOURSE_ACTION: RecourseActionSchema,
    THRESHOLD_TYPE: z.literal('BOOLEAN_MANDATE'),
    VALUE: z.boolean(),
});

const ConstraintDefinitionSchema = z.discriminatedUnion('THRESHOLD_TYPE', [
    numericConstraint,
    booleanConstraint,
]);

// 3. RCDM File Structure Schema
const RCDMFileStructureSchema = z.object({
    RCDM_VERSION: z.string().regex(/^v\d+\.\d+(\.\d+)?$/, "Invalid RCDM version format (must be vX.Y.Z)"),
    CRITICAL_SAFETY_CONSTRAINTS: z.record(z.string().nonempty(), ConstraintDefinitionSchema),
});

/**
 * Validates the loaded RCDM configuration against the schema using Zod.
 * Essential for L0/L1 safety assurance during system initialization.
 */
export function validateRCDMConfiguration(): void {
    console.log("RCDM: Running runtime configuration validation...");
    try {
        RCDMFileStructureSchema.parse(RCDM);
        console.log("RCDM: Configuration validated successfully.");
    } catch (error) {
        console.error("RCDM VALIDATION FAILED! Critical startup constraint violation detected.");
        if (error instanceof z.ZodError) {
            console.error(JSON.stringify(error.issues, null, 2));
        }
        // Immediate halting is crucial for safety constraints
        process.exit(1);
    }
}
