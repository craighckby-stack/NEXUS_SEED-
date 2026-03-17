# SGS SCHEMA VERSION REGISTRY (SSVR)

## 1. Governance Mandate and Role (L0 Enforcer)

The SSVR is the exclusive, cryptographically enforced Source of Truth for all core SGS standards, configurations, and governance components (GICM, CDSM, HETM). Its primary function is the runtime delivery and validation of immutable structural specifications, actively preventing unauthorized schema drift across all dependent operational, archival, and execution agents.

## 2. Integrity and Cryptographic Protocol

A. **Root of Trust Custody (CRoT):**
Exclusive management and structural validation custody is held by the Central Registry of Trust (CRoT).

B. **Integrity Hashing Standard:**
All primary integrity fields utilize **SHA3-384** for verification unless otherwise overridden by a specific schema definition.

C. **Bootstrap Validation (S0 Check):**
During initialization (ROM-equivalent), the current SSVR integrity hash must be cryptographically validated against the immutable S0 ANCHOR reference. Failure mandates immediate system halt.

## 3. Critical Governance Mutation (CGM) Protocol

Any successful mutation or update to the SSVR requires verified consensus to ensure decentralized governance.

1.  **Quorum Threshold:** A 2/3 majority of signatures from the recognized Global Anchor Signers (GAS) is mandatory.
2.  **Attestation Log Commitment:** The explicit cryptographic proofs of this Quorum consensus must be immutably recorded in the Consensus State Transaction Log (CSTL) *before* the new SSVR version is activated operationally.

## 4. Canonical Structure Definition

The SSVR adheres strictly to the JSON Schema found at `governance/schema/SSVR.schema.json`. 

| Field Name | Type | Description | Enforcement Requirement |
| :--- | :--- | :--- | :--- |
| `integrity_hash` | String | SHA3-384 hash of the canonical payload (excluding itself). | Mandatory runtime verification. |
| `sgs_system_version` | String | Target overall SGS software iteration this schema set serves. | Client compatibility check. |
| `version_id` | Integer | Monotonically increasing, globally unique SSVR version identifier. | Used for synchronization and update ordering. |
| `schema_definitions` | Array | Detailed listing (name, version, content hash) for every mandated SGS schema. | Primary source of truth for component structures. |
| `attestation_log` | Object | Cryptographic proof object confirming Quorum consensus (See: `governance/interface/SSVR_Attestation_Schema.json`). | Enforces Section 3 CGM protocol requirement. |