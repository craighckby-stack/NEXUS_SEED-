# 1.0 CGDU SPECIFICATION: HIGH-ASSURANCE CONFIGURATION STATE ROOT (CSR) GENERATION (v99.0)

## 1.1 Mandate, Determinism, & Scope
CGDU is an execution-critical, single-pass micro-service. CGDU MUST provide deterministic, cryptographic aggregation of Immutable Configuration Artifacts (ICAs) to generate the Verifiable Config State Root (CSR) hash. The successful generation of the CSR signifies configuration consensus and enables integrity chaining for the subsequent deployment lifecycle.

## 1.2 Governing Agents & Operational Integration
*   **A. Governing Agents:** CRoT (Signing Authority), GAX (Input Provisioning Layer), TCB (Audit Destination).
*   **B. Trust Point Execution:** CGDU MUST execute atomically. Its completion, verified by TCB log commit, MUST precede GSEP-C Stage S00 (Trust Anchoring Phase) commencement.
*   **C. Dependency Validation:** Prior to Section 3.1 execution, CGDU SHALL query the Canonical Utility Manifest Registry (CUMR) to confirm the integrity and version compliance of the mandated CCDEU runtime.

## 2.0 INPUT ARTIFACTS (Immutable Configuration Artifacts - ICAs)
CGDU SHALL only possess strictly read-only access. All ICAs MUST be integrity-checked prior to CGDU execution commencement. Input ordering is invariant and non-negotiable for deterministic processing:

| Order | Alias | Artifact Type | Constraint | Description |
|-------|-------|---------------|------------|-------------|
| 1     | `ACVD` | Constraint Vector | JSON/YAML | Axiomatic Constraint Vector Definition |
| 2     | `FASV` | Validation Schema | JSON/YAML | Final Axiomatic State Validation Schema |
| 3     | `EPB`  | Execution Blueprint | JSON/YAML | Runtime Execution Parameter Blueprint |

## 3.0 EXECUTION PIPELINE: CSR GENERATION (T+0 Enforcement)

### 3.1 Standardization (Canonicalization & CBS Generation)
Each ICA MUST be processed independently by the Canonical Configuration Definition Enforcement Utility (CCDEU) to generate its unique Canonical Byte Stream (CBS). CCDEU MUST enforce:
*   Standard UTF-8 encoding.
*   Lexicographical sorting, recursively applied to all dictionary keys.
*   Zero indentation, omission of trailing/leading whitespace, and rigorous scalar normalization.

### 3.2 Aggregation & Concatenation
The resulting CBS streams are concatenated linearly and without separators in the fixed order defined in Section 2.0:
$$
\text{TotalStream} = \text{CBS}(\text{ACVD}) \| \text{CBS}(\text{FASV}) \| \text{CBS}(\text{EPB})
$$

### 3.3 Config State Root (CSR) Generation
The $\text{TotalStream}$ is cryptographically digested using the sole mandated primitive.
*   **Algorithm:** SHA3-512.
*   **Output:** CSR (Config State Root) hash.

## 4.0 OUTPUT, AUDIT, & PURGE MANDATES

### 4.1 Output Artifact: CSR
*   **Format:** 128-character Hexadecimal string.
*   **Disposition:** Immediate secure delivery to CRoT for official cryptographic signing.

### 4.2 TCB Verification Log (Audit Mandate)
A single, immutable audit entry MUST be committed to the TCB. This log entry SHALL follow the structure defined in the `AUDIT-S01` standard and MUST contain:
1.  CGDU Execution Hash (e.g., self-hash of the running container/binary).
2.  Input Hashes (SHA256) for ACVD, FASV, and EPB (prior to canonicalization).
3.  The final 128-character CSR.
4.  CCDEU version identifier and integrity check hash (validated against CUMR).

### 4.3 Operational Resilience & Failure Handling
In the event of *any* pipeline failure (e.g., I/O error, dependency validation failure, TCB log commitment failure), CGDU MUST terminate execution immediately and return a predefined non-zero exit code (`STATUS: E-CSR-780`) to the GAX provisioning layer. No intermediate data or partial hashes SHALL persist.

### 4.4 Purge Mandate
Upon successful execution (CSR delivery and TCB log commitment), the active CGDU container and all associated temporary buffers MUST be immediately and non-recoverably purged from the environment.