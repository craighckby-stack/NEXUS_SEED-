# 1.0 CANONICAL UTILITY MANIFEST REGISTRY (CUMR) SPECIFICATION (v1.0)

## 1.1 Role and Scope
The CUMR serves as the single source of truth for cryptographic manifests and version validation parameters for all system critical, canonical definition utilities (CDUs), including CCDEU. CUMR ensures that execution components are provably untampered and authorized by the CRoT.

## 2.0 DATA STRUCTURE (Manifest Schema)
The CUMR data structure SHALL be an integrity-sealed, immutable JSON/YAML artifact, signed by CRoT.

### 2.1 Manifest Entry Schema (Utility Manifest)
Each registered utility MUST adhere to the following schema:

| Key | Type | Description |
|---|---|---|
| `Utility_ID` | String (UUID) | Unique identifier for the utility (e.g., CCDEU-V2). |
| `Version` | String (Semantic) | The validated Semantic Version tag. |
| `Commit_Hash` | String (SHA512) | Source code repository commit hash associated with this release. |
| `Binary_Root_Hash` | String (SHA3-512) | Cryptographic digest of the utility's compiled executable/binary artifact. This is the root verification value. |
| `Signature_Chain` | Array[String] | Verification chain proving authorization by CRoT. |

## 3.0 ACCESS AND INTEGRITY MANDATES

### 3.1 Access Model
Only authenticated read operations are permitted by runtime utilities (e.g., CGDU, GSEP). Access MUST be routed through the TCB trust domain to ensure integrity of the retrieved manifest.

### 3.2 Deployment Validation
Any component attempting to utilize a Canonical Definition Utility MUST first query the CUMR manifest using the expected `Utility_ID` and `Version`. The running component's self-calculated binary hash MUST exactly match the `Binary_Root_Hash` listed in the CUMR manifest. Failure MUST halt the utilizing component's execution immediately (e.g., CGDU uses E-CSR-780).