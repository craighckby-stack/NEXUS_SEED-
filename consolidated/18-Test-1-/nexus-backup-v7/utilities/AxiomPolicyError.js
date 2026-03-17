/**
 * Custom error class specifically for Axiom Management and Policy Violations.
 * This allows upstream consumers (e.g., control plane) to deterministically catch
 * policy-related initialization or validation failures, distinguishing them from
 * standard runtime or I/O errors.
 */
class AxiomPolicyError extends Error {
    /**
     * @param {string} message - Description of the policy failure.
     * @param {string} code - An internal code classifying the error (e.g., 'VERSION_MISMATCH', 'HARD_LIMIT_VIOLATION').
     */
    constructor(message, code = 'POLICY_FAILURE') {
        super(`[PolicyError ${code}] ${message}`);
        this.name = 'AxiomPolicyError';
        this.code = code;
        // Ensure proper stack trace capture
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AxiomPolicyError);
        }
    }
}

module.exports = AxiomPolicyError;
