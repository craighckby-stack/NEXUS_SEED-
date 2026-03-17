## System Cryptographic Policy Index (SCPI-T03) Specification

**MISSION:** To provide a single, versioned, auditable source of truth for all active, sanctioned cryptographic primitives (hashing algorithms, signature schemes, key lengths) mandatory for system integrity operations (e.g., GIRAM, DILS commitment).

**SECURITY CONSTRAINT:** SCPI-T03 is a core component of the Trust Calculus. Any modification requires mandatory TIER 1 Consensus via EGOM (Executive Governance Oversight Module) and automatic GSEP rollback if attestation fails the subsequent GIRAM execution.

**INTEGRITY MODEL:** SCPI-T03 must itself be attested by a unique Governance Policy Key (GPK) and committed to the DILS before being referenced by GIRAM.

**SCHEMA (SCPI-Entry Example):**
-   `Policy_ID`: T03-H512
-   `Algorithm_Name`: KECCAK-512
-   `Algorithm_Key`: SHA3-512
-   `Key_Length_Minimum`: N/A (for hash)
-   `Effective_Date`: 2024-08-15T00:00:00Z
-   `Integrity_Usage_Scope`: [GIRAM_ASD, DILS_Commit_V2, GRTA_Signature]
-   `Status`: ACTIVE | DEPRECATED | PENDING_VETO