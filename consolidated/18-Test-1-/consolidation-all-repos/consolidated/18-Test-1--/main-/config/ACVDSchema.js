import { z } from 'zod'; // Assumed dependency for type safety and validation

/**
 * ACVD Schema Definitions (v1.1)
 * Defines the canonical structure and constraints for the 
 * Axiomatic Constraint Vector Definition (ACVD).
 */

// --- Sub-Schemas ---

export const ACVDMetadataSchema = z.object({
    version: z.number().int().min(1).describe("Sequential policy version identifier (starts at 1)."),
    creationTimestamp: z.string().datetime().describe("ISO timestamp of policy creation."),
    issuer: z.enum(["CGR", "CORE_SYSTEM", "ADVISORY_BOARD"]).default("CORE_SYSTEM").describe("The entity that issued or updated the policy."),
    hashSignature: z.string().min(64).max(128).describe("Cryptographic hash ensuring governance approval and integrity.")
}).strict();

export const ACVDConstraintSchema = z.object({
    id: z.string().uuid().describe("Unique identifier for the specific constraint."),
    targetDomain: z.enum(["ARCHITECTURE", "CODE_EVOLUTION", "PERCEPTION", "GOVERNANCE"]).describe("System domain the constraint applies to."),
    metricPath: z.string().describe("JSON path or dotted notation to the monitored metric (e.g., 'system.memory.usage')."),
    thresholdType: z.enum(["MAX", "MIN", "EQUALITY", "DELTA_RATE"]).describe("Type of comparison to apply."),
    value: z.number().or(z.string()).describe("The threshold value (numeric or string identifier)."),
    enforcementAction: z.enum(["FLAG", "BLOCK_EXECUTION", "INITIATE_FALLBACK", "SCALE_BACK"]).default("BLOCK_EXECUTION").describe("Action taken upon constraint violation.")
}).strict();

export const ACVDParametersSchema = z.object({
    UFRM: z.number().min(0.0).max(1.0).describe("Unforeseen Risk Mitigation factor (0.0 to 1.0). Controls generalization."),
    CFTM: z.number().min(0.0).max(1.0).describe("Constraint Fulfillment Threshold Maximum (Tolerance for divergence)."),
    SelfCorrectionFidelity: z.number().min(0.7).max(1.0).describe("Minimum required fidelity for internal self-correction proofs/inferences."),
    autonomyLevel: z.enum(["LOW", "MEDIUM", "HIGH", "SOVEREIGN"]).default("SOVEREIGN").describe("Current operational autonomy mode, determining constraint rigidity.")
}).strict();

// --- Main Schema and Utility ---

export const ACVDSchema = z.object({
    metadata: ACVDMetadataSchema,
    parameters: ACVDParametersSchema,
    constraints: z.array(ACVDConstraintSchema).min(1).describe("Detailed, rigorous constraint vectors applied to specific subsystems.")
}).strict().describe("Axiomatic Constraint Vector Definition (ACVD) Root Schema.");

/**
 * Validates a candidate ACVD object against the defined schema using Zod.
 * @param {unknown} candidate - The object to validate.
 * @returns {typeof ACVDSchema._output} The validated and parsed object.
 * @throws {z.ZodError} If validation fails.
 */
export function validateACVDStructure(candidate) {
    return ACVDSchema.parse(candidate);
}
