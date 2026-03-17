## Component Specification: RCR (Rollback Commitment Registrar)

**Component ID:** RCR-v1.0
**Governing Pillar:** AIA (Atomic Immutable Architecture)
**Primary Function:** Secure, auditable, high-priority state reversal, triggered exclusively by mandatory catastrophic failure traces (F-01).
**Operational Protocol:** Atomic Rollback Sequence (ARS)

### I. RCR Dependencies & Governing Contracts

The RCR requires cryptographic validation and orchestration control from external modules before initiating any state mutation.

**Key Dependencies:**
*   CTG (Commitment Trace Generator): Provides the mandatory, signed Rollback Instruction (I-R).
*   D-01 (Data Ledger): Immutable cryptographic logging service for all M-R transactions.
*   AEOR (Atomic Execution Orchestrator): Provides the authorized State Reversal API control.
*   PDIS (Policy Definition and Integrity Service): Verifies the integrity and version of the RCR Security Policy (RSP).

### II. Data Contract: Rollback Mutation Payload (M-R)

The M-R is treated as a forward, high-priority state transition transaction (P9) within the AIA ledger, ensuring that the reversal itself is an immutable, verifiable event.

**Payload M-R Structure (Data Contract v1.1):**
1.  **Failure Trace ID (FTID):** Reference to the originating F-01 event.
2.  **Target State Hash (H-RT):** The cryptographic state hash to which the system must revert.
3.  **Policy Violation Manifest (PVM):** Detailed trace of the policy violation leading to the F-01 trigger.
4.  **Original State Mutation Hash (M-02):** Hash of the specific transaction being reversed.
5.  **Attestation Signatures (Sig-Set):** Required multi-signatures (CTG, AEOR, RCR) verifying instruction authenticity.
6.  **RSP Version ID (RSP-VID):** Cryptographically linked version of the governing security policy used during execution.

### III. Atomic Rollback Sequence (ARS) Protocol

The ARS protocol is a ledger-locked sequence designed to guarantee atomicity and comprehensive audibility.

**ARS-P01: Instruction Validation & Policy Enforcement**
1.  RCR receives the signed Instruction (I-R) from CTG.
2.  RCR queries PDIS to retrieve and verify the current RSP-VID.
3.  RCR validates I-R signatures, key revocation status, and adherence to RSP time-out thresholds.

**ARS-P02: M-R Construction & Intent Locking**
1.  If validation succeeds, RCR constructs the complete M-R payload.
2.  RCR forces a mandatory D-01 ledger entry (Type: REVERSAL_INTENT, Status: PENDING, Priority: P9).
3.  This entry initiates a cryptographic lock (CL-RCR) on the system state, preventing any non-M-R mutation until ARS resolution.

**ARS-P03: State Reversal Execution**
1.  RCR invokes the AEOR Rollback API, submitting the finalized M-R payload.
2.  AEOR executes the physical, atomic state reversion to H-RT.

**ARS-P04: Finalization & Critical Failure Mandates**
*   **SUCCESS:** RCR receives cryptographic verification from AEOR (H-RT confirmation). RCR commits the final M-R transaction to D-01 (Type: REVERSAL_SUCCESS, Status: COMMITTED), sealing the sequence and releasing CL-RCR.
*   **FAILURE (Rollback Execution Failure):** If AEOR fails or verification fails, RCR logs a critical incident (D-01, Type: REVERSAL_CRITICAL_FAILURE, Status: LOCKED). RCR then triggers the primary system quarantine protocol (QRT-01) and alerts supervisory AGI, maintaining the CL-RCR lock to prevent further corruption.

### IV. Governing Constraints

1.  **Immutability:** RCR transactions are strictly additive to D-01. Original records (M-02) must not be altered or deleted.
2.  **Velocity:** M-R transactions are mandated Priority Level 9 (P9), ensuring real-time execution priority over standard operations (P1-P8).
3.  **Attestation:** All M-R lifecycle stages require mandatory multi-signature attestation (CTG, AEOR, RCR) governed by the active RSP-VID.