import { z } from 'zod';
import RCDM from '../config/RCDM.json';

// --- 1. Core Definitions (Optimize using `z.enum` for efficient lookup) ---

// Define arrays for type safety and compile-time optimization
const RECOURSE_ACTIONS = ['HALT_AND_QUARANTINE', 'ABORT_INFERENCE_PATH', 'LOG_VETO_PROPAGATE'] as const;
const LAYERS = ['L0_KERNEL_SAFEGUARD', 'L1_CORE_PROCESS', 'L2_ADAPTIVE_LAYER'] as const;

const RecourseActionSchema = z.enum(RECOURSE_ACTIONS);
const ConstraintLayerSchema = z.enum(LAYERS);

// --- 2. Constraint Base Abstraction ---
// Factoring out common fields to maximize DRY and readability (recursive abstraction)

const BaseConstraintMetadata = z.object({
    DESCRIPTION: z.string().min(1, 'Description cannot be empty.'),
    METRIC_ID: z.string().min(1, 'Metric ID cannot be empty.'),
    LAYER: ConstraintLayerSchema,
    UNIT: z.string().optional(),
    RECOURSE_ACTION: RecourseActionSchema,
});

// --- 3. Specific Constraint Schemas (Extending Base Metadata) ---

const NumericConstraintSchema = BaseConstraintMetadata.extend({
    // Discriminator field definition
    THRESHOLD_TYPE: z.union([z.literal('MINIMUM'), z.literal('MAXIMUM')]),
    VALUE: z.number(),
});

const BooleanConstraintSchema = BaseConstraintMetadata.extend({
    // Discriminator field definition
    THRESHOLD_TYPE: z.literal('BOOLEAN_MANDATE'),
    VALUE: z.boolean(),
});

// Use Discriminated Union for efficient runtime validation based on THRESHOLD_TYPE
const ConstraintDefinitionSchema = z.discriminatedUnion('THRESHOLD_TYPE', [
    NumericConstraintSchema,
    BooleanConstraintSchema,
]);

// --- 4. RCDM File Structure Schema ---

const RCDMFileStructureSchema = z.object({
    RCDM_VERSION: z.string().regex(/^v\d+\.\d+(\.\d+)?$/, "Invalid RCDM version format (must be vX.Y.Z)"),
    // Recursive validation structure
    CRITICAL_SAFETY_CONSTRAINTS: z.record(z.string().min(1, 'Constraint key cannot be empty.'), ConstraintDefinitionSchema),
});

/**
 * Validates the loaded RCDM configuration against the schema using Zod.
 * Essential for L0/L1 safety assurance during system initialization.
 * Optimized for fail-fast critical path execution.
 */
export function validateRCDMConfiguration(): void {
    console.log("RCDM: Validating configuration integrity...");
    try {
        // Fast synchronous parse path
        RCDMFileStructureSchema.parse(RCDM);
        console.log("RCDM: Configuration integrity verified.");
    } catch (error) {
        console.error("RCDM VALIDATION FAILED! Critical startup constraint violation detected.");
        if (error instanceof z.ZodError) {
            console.error(JSON.stringify(error.issues, null, 2));
        } else {
            console.error("An unknown error occurred during validation.", error);
        }
        // Immediate halting (L0 Recourse Action)
        process.exit(1);
    }
}