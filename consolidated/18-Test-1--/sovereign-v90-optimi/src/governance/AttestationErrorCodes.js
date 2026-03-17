/**
 * Standardized error codes for AttestationFailureRecord.
 * Ensures consistent reporting and auditing of governance integrity failures.
 * Naming convention: AFR_E_[CATEGORY]_[ID]
 */
const AttestationErrorCodes = Object.freeze({
    // ----- Runtime Environment Integrity Checks (RAM, CPU, Net) -----
    AFR_E_RAM_001: 'RUNTIME_MEMORY_EXCEED',
    AFR_E_CPU_002: 'RUNTIME_CPU_USAGE_SPIKE',
    AFR_E_NET_003: 'UNAUTHORIZED_NETWORK_CALL',
    AFR_E_FS_004: 'FILESYSTEM_CHECK_FAIL',

    // ----- Governance Configuration/Policy Integrity Checks -----
    AFR_E_CFG_101: 'POLICY_VIOLATION_CRITICAL',
    AFR_E_CFG_102: 'POLICY_VERSION_MISMATCH',
    AFR_E_CFG_103: 'CONFIG_TAMPERING_DETECTED',

    // ----- Attestation Report Processing Failures -----
    AFR_E_RPT_201: 'REPORT_SIGNATURE_INVALID',
    AFR_E_RPT_202: 'REPORT_SCHEMA_INCOMPATIBLE',
    AFR_E_RPT_203: 'REPORT_TRUST_ROOT_MISSING',

    // ----- Self-Verification/AGI State Failures -----
    AFR_E_AGI_301: 'SELF_VERIFICATION_FAILED',
    AFR_E_AGI_302: 'INSUFFICIENT_PROOFS_GENERATED'
});

/**
 * Registry Kernel for standardized error codes related to Attestation Failures.
 * This ensures asynchronous, immutable access to critical governance constants,
 * replacing the previous synchronous module export.
 */
class AttestationErrorCodesRegistryKernel {
    constructor() {
        /** @private */
        this._codes = AttestationErrorCodes;
        this._isInitialized = false;
    }

    /**
     * Initializes the kernel. Required by the strategic kernel interface.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this._isInitialized) {
            return;
        }
        // Maintains consistency with asynchronous registry patterns.
        this._isInitialized = true;
    }

    /**
     * Retrieves the immutable map of Attestation Failure Record (AFR) error codes.
     * @returns {Promise<Readonly<Object<string, string>>>}
     */
    async getCodes() {
        return this._codes;
    }
}

module.exports = AttestationErrorCodesRegistryKernel;