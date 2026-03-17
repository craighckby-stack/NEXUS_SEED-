# AGENT SPECIFICATION: FORENSIC INTEGRITY AGENT (FIA)

## 0. Configuration Block (ACB)
| Parameter | Value | Definition | Constraint |
|:---:|:---:|:---|:---:|
| Agent ID | A-FIA-001 | Unique System Identifier | Mandatory |
| Version | 2.0.0 (Refactored) | Specification Version | Incremental |
| Status | Tier-0 Critical | Operational Priority Class | Non-Degradable |
| Domain | P-05 (Integrity Enclave) | Isolated Trust Context | Architectural (SEE) |

## 1. Core Mandate: Attested State Commitment and Immutability

The Forensic Integrity Agent (FIA) maintains the singular mandate of establishing and verifying the integrity of the system state immediately prior to catastrophic failure. This involves executing the **Atomic State Attestation (ASA)** sequence and managing the resulting immutable records.

### 1.1 Key Terminology Update
- **TEDS (Total Execution Deterministic Snapshot)** is formally renamed to **ASC (Attested State Commit)**, emphasizing the cryptographic verification requirements over mere capture.
- The capture sequence is referred to as the **Forensic Commit Protocol (FCP)**.

## 2. Security Context: Isolated Execution Enclave (SEE)

The FIA must operate within a **Secure Execution Enclave (SEE)**, denoted as Trust Domain P-05. This enforces non-negotiable architectural segregation necessary for evidentiary integrity.

1.  **Architectural Segregation:** P-05 environment (including its storage layer, the Forensic Vault Module - FVM) must be logically and physically isolated from P1-P4 standard execution domains (SGS, GAX, etc.). This isolation must prevent back-propagation of operational state changes or retrospective modification attempts.
2.  **Functional Restriction:** FIA is prohibited from executing non-forensic workflow logic (e.g., DSE, Mission Control). Its execution scope is strictly limited to real-time integrity assurance, cryptographic signing, hash chaining, and FCP execution.

## 3. Operational Trigger: Rollback Protocol (RRP) Activation

FIA passively monitors the `RRP Activation Interface (RRP-AI)` for confirmed Fault Mask Signals, indicating the initiation of the Rollback Protocol (RRP).

### 3.1 Fault Mask Signals (Trigger Sources)
System telemetry alerts confirming state inconsistency:
- `PVLM`: Policy Violation Logic Mask
- `MPAM`: Mission Parameter Anomaly Mask
- `ADTM`: Adversarial Threat Model confirmation
- `P-01 Failure Lock`: Direct command from Root Governance.

### 3.2 Action Sequence (Forensic Commit Protocol - FCP)
Upon receiving a confirmed Fault Mask Signal, the FIA executes the mandatory FCP sequence:
1.  **State Hard Lock (Atomic Freeze):** Immediate cessation of system clock advancement/memory modification outside of the P-05 boundary.
2.  **ASC Generation:** Capture of the deterministic frozen state.
3.  **Integrity Chaining:** Hashing and cryptographic linking of the ASC to previous operational states.
4.  **Root Signing:** Submission of the ASC hash block to the CRoT for final attestation.

## 4. Artifact Contracts and Data Outputs

The FIA is responsible for producing two integrity-verified artifacts, securely stored in the FVM.

| Artifact ID | Name | Description | Output Consumer | Integrity Requirement |
|:---:|:---|:---|:---:|:---:|
| **ASC** | Attested State Commit | The cryptographically signed, immutable state record captured during the FCP.| GAX (RRP Analysis Module) | Immutability (Requirement 5.0). Signed by CRoT. Chained Hash Proof. |
| **RPR** | Rollback Policy Report | Filtered, anonymized statistical data derived *exclusively* from the verified ASC for policy optimization.| GAX (Policy Adaptation Module) | Verified traceability via linkage to source ASC cryptographic hash. |

## 5. Trust Anchor and Verification

The **Chain of Root Trust (CRoT)** remains the external authority responsible for digitally signing the ASC, establishing the final proof of compliance regarding isolation and immutability standards defined by this specification (ASC-2.0.0 Standard).