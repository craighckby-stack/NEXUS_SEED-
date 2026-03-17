/**
 * ACVD Schema Definitions (v1.1)
 * Provides centralized access to the ACVD validation policy via the ACVDValidator plugin.
 *
 * This module now leverages the KernelCapabilityInvoker for standardized, robust plugin execution.
 */

// Assume KERNEL_SYNERGY_CAPABILITIES is globally available and initialized.

/**
 * Isolates and validates the core dependency (KernelCapabilityInvoker) required for execution.
 * This strictly separates dependency resolution and failure logic from the module initialization path.
 * @returns {object} The validated invoker object.
 * @throws {Error} If the dependency is missing or incomplete.
 */
function _getValidatedInvoker() {
    const invoker = KERNEL_SYNERGY_CAPABILITIES?.Plugin?.get("KernelCapabilityInvoker");

    if (!invoker || typeof invoker.execute !== 'function') {
        // Ensure immediate, traceable failure upon module load if the kernel is misconfigured.
        throw new Error("[ACVDSchema Setup Failure] Core execution invoker (KernelCapabilityInvoker) is not available or incomplete. System integrity compromised.");
    }
    return invoker;
}

// Optimization: Resolve and validate the core dependency once at module initialization time,
// shifting the integrity check cost outside the hot execution path.
const ACVD_INVOKER = _getValidatedInvoker();

/**
 * Validates a candidate ACVD object against the defined schema using the kernel's validation service.
 * @param {unknown} candidate - The object to validate.
 * @returns {unknown} The validated and parsed object (type inferred by runtime context).
 * @throws {Error} If validation fails or if required plugins are missing.
 */
export function validateACVDStructure(candidate: unknown): unknown {
    // The dependency is pre-validated, allowing for direct, clean execution delegation.
    return ACVD_INVOKER.execute("ACVDValidator", "validate", candidate);
}