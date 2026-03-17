# Policy Configuration Trust Management (PCTM) V99.1 Specification

## 1.0 Scope and Mandate

The PCTM V99.1 protocol defines the minimum cryptographic and structural requirements for all Axiom Governance Configuration Assets (AGCA). This specification guarantees the integrity, provenance, and traceable lifecycle of AGCA, mitigating governance supply chain risks. AGCA includes, but is not limited to, PVLM, ADTM, and CFTM configurations.

## 2.0 AGCA Trust Structure (PCTM-STR)

All AGCA files MUST strictly conform to the structural definition provided in `schema/AGCA_PCTM_V1.json`. Non-conforming assets SHALL result in immediate validation failure (TERMINAL SIH halt).

### 2.1 Certified Metadata Block (Mandatory)

The root level of the AGCA object SHALL contain the following fields. Validation of these fields constitutes the Configuration Integrity Validation (CIV) module's Stage S0 check during GSEP-C ANCHOR INIT.

| Field Name | Requirement ID | Type | Constraint | Description |
| :--- | :--- | :--- | :--- | :--- |
| `pctm_standard_id` | PCTM-REQ-001 | String | Static: "V99.1" | Protocol version identification. |
| `owner_agent` | PCTM-REQ-002 | String | Required | Originating governance agent (e.g., GAX, SVT). |
| `last_modified_utc` | PCTM-REQ-003 | String | ISO 8601 | Timestamp of last authorized modification. |
| `configuration_data` | PCTM-REQ-004 | Object | Required | The actual policy definition payload. |

## 3.0 Integrity and Provenance Requirements (PCTM-CIP)

### 3.1 Semantic Attestation Layer (SAL) Requirements

PCTM-REQ-005: The AGCA MUST include the field `"policy_axiom_version"`, adhering to MAJOR.MINOR.PATCH semantic versioning.
PCTM-REQ-006: Any update affecting the policy rule payload (e.g., rule changes, veto condition modifications) SHALL require a MINOR version bump. Structural changes to the asset format SHALL require a MAJOR bump.

### 3.2 Cryptographic Integrity

PCTM-REQ-007: The AGCA MUST contain a mandatory SHA-256 hash of the `configuration_data` block, stored in the `hash_sha256` field (64-character Hex string). This hash SHALL be verified prior to signature processing.
PCTM-REQ-008: The asset MUST be cryptographically signed by an authorized Governance Key Manifest (GKM). The verified signature SHALL be included in the `gkm_signature` field.
PCTM-REQ-009: The metadata SHALL include the reference ID of the signing GKM to facilitate lookup against the CRoT approved list.

## 4.0 GSEP-C Integration

The CIV module SHALL utilize PCTM-CIP requirements during GSEP-C Stage S0 (ANCHOR INIT) to perform rapid schema adherence checks, hash verification, and signature authentication against the CRoT approved GKM list. Failure of any PCTM-REQ SHALL trigger a TERMINAL (SIH) halt state, preventing configuration execution.