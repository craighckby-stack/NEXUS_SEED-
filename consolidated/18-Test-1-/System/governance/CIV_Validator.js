/**
 * Configuration Integrity Validation (CIV) Module
 * Implements Policy Configuration Trust Management (PCTM) V99.1 requirements.
 * References: config/PCTM_V98.3_DEFINITION.md
 */

const PCTM_STANDARD_ID = "V99.1";

/**
 * Executes PCTM S0 (ANCHOR INIT) checks for an Axiom Governance Configuration Asset (AGCA).
 * This function implements requirements PCTM-REQ-001 through PCTM-REQ-009.
 * @param {object} config - The AGCA object loaded from file.
 * @returns {boolean} True if validation succeeds.
 * @throws {Error} If any PCTM requirement fails, triggering a TERMINAL SIH halt.
 */
function validatePCTM(config) {
    // --- 2.1 Certified Metadata Block Check (S0 Check) ---
    const requiredFields = ['pctm_standard_id', 'owner_agent', 'last_modified_utc', 'configuration_data'];
    for (const field of requiredFields) {
        if (!(field in config)) {
            throw new Error(`PCTM Validation Error (S0/Metadata): Missing mandatory field: ${field}. (Ref: PCTM-REQ-001/002/003/004)`);
        }
    }

    // PCTM-REQ-001: Standard ID verification
    if (config.pctm_standard_id !== PCTM_STANDARD_ID) {
        throw new Error(`PCTM Validation Error (S0/ID): Expected protocol ID ${PCTM_STANDARD_ID}, received ${config.pctm_standard_id}. (Ref: PCTM-REQ-001)`);
    }

    // --- 3.1 Semantic Attestation Layer (SAL) Check ---
    const configData = config.configuration_data;
    
    // PCTM-REQ-005: Policy Axiom Version check (Semantic versioning validation structure)
    if (!configData.policy_axiom_version || typeof configData.policy_axiom_version !== 'string' || !/^\d+\.\d+\.\d+$/.test(configData.policy_axiom_version)) {
        throw new Error("PCTM Validation Error (SAL): Invalid or missing 'policy_axiom_version' in configuration data payload. (Ref: PCTM-REQ-005)");
    }
    
    // --- 3.2 Cryptographic Integrity Check ---
    
    // PCTM-REQ-007: Hash Verification (Requires imported utility functions, stubbed validation)
    if (!config.hash_sha256) {
        throw new Error("PCTM Validation Error (Integrity): Mandatory 'hash_sha256' field is missing. (Ref: PCTM-REQ-007)");
    }
    // NOTE: Actual SHA-256 verification relies on centralized /utility/crypto logic post-merge.

    // PCTM-REQ-008 & 009: Signature and GKM Reference Verification
    if (!config.gkm_signature) {
        throw new Error("PCTM Validation Error (Provenance): Mandatory 'gkm_signature' is missing. (Ref: PCTM-REQ-008)");
    }
    if (!config.gkm_reference_id) {
        throw new Error("PCTM Validation Error (Provenance): Mandatory 'gkm_reference_id' is missing. (Ref: PCTM-REQ-009)");
    }
    // NOTE: Signature verification logic must be integrated via UNIFIER.js using authenticated Governance Keys.

    console.log(`[CIV] Configuration ${config.owner_agent} validated against PCTM V99.1 S0 requirements.`);
    return true; // Successful Stage S0 check
}

export { validatePCTM };