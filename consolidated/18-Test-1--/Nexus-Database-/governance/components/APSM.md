## Artifact Provenance & Security Module (APSM) - Governance Enforcement Point (GEP)

**Component ID:** APSM.V3 (Refactored)
**GSEP Scope:** Stage 2 - Pre-Commit Trust & Integrity Validation

### I. Strategic Mandate & Gating Function
The APSM serves as the definitive security gate between Stage 2 and Stage 3 (Pre-Commit Simulation Run - PSR). Its core mandate is to establish undeniable **Proof of Origin** and enforce the **Policy of Non-Malice** for the M-02 Mutation Payload and its execution environment. Failure to clear APSM criteria triggers an immediate fail-safe (SQ-01), preventing computational resource expenditure and preserving system entropy.

### II. Operational Pipeline: Security & Provenance Validation

#### 1. Artifact Integrity & Provenance Ledgering (AIPL)
*   **Action:** Executes Chain of Custody (CoC) validation against the M-02 payload.
*   **Verification:** Cryptographically validates all signatures against the Authorized Origin Cluster (AOC) root register.
*   **Output:** Generates and commits the immutable metadata payload hash to the **Immutable Artifact Ledger (IAL)**, ensuring non-repudiation across the system state.

#### 2. Risk Scoring & Nexus Integration (RSNI)
*   **Action:** Conducts recursive dependency graph analysis (static/dynamic behavior) on the artifact set.
*   **Query:** Interfaces with the Central Vulnerability Nexus (CVN) and the Internal Risk Registry (IRR) to detect known vectors, behavioral anomalies, and conflict flags. (IRR supersedes C-22 nomenclature).
*   **Output:** Derives the preliminary **Trust Score (T-score)** based on weighted risk parameters (configured externally by the RSWE).

#### 3. Governance Policy Enforcement Gate (PEG)
*   **Action:** Automated schema and regulatory compliance check.
*   **Verification:** Vetoes artifact acceptance if dependency licensing, architectural structure, or structural constraints defined by the **Governance Rule Source (GRS)** are violated. This check enforces a hard fail, regardless of the RSNI T-score.
*   **Output:** Policy Compliance Flag (Boolean).

### III. Exit Criteria & Artifact Trust Record (ATR)

APSM successful execution culminates in the issuance of a digitally signed **Artifact Trust Record (ATR)**, transitioning control to Stage 3. The ATR utilizes a formalized structure:

| Field | Type | Description |
| :--- | :--- | :--- |
| `artifact_hash` | String (SHA256) | Hash committed to IAL. |
| `t_score` | Float | Final weighted Trust Score (must be ≥ `T_MIN`). |
| `policy_compliant`| Boolean | Must be TRUE (PEG success). |
| `signer_key_id` | String | Key ID of the APSM attestor instance. |
| `timestamp` | UTC Timestamp | Time of attestation. |

**Validation Success:** ATR issued. `T-score` meets minimum threshold (`T_MIN`) AND `policy_compliant` is TRUE.
**Validation Failure:** Triggers immediate system quarantine (SQ-01 protocol). The Compliance Trace Generator (CTG) logs the failure, categorized as 'Integrity Conflict' (AIPL/RSNI failure) or 'Policy Veto' (PEG failure), initiating F-01 forensic analysis.