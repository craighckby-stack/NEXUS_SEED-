# PROPOSAL LIFECYCLE STATE TRACKER (PLST) SPEC V2.1: IMMUTABILITY & AUDIT

**Scope:** Define the canonical state machine, mandatory immutable artifacts, and stringent transition constraints required for a Governance Proposal to achieve verified readiness (S4_PRE_INGRESS) before submission to the Governance System Execution Protocol - Control Layer (GSEP-C).

**Mandate:** All proposals, excluding those authorized via GSEP-C FTO/L-0 (Fast Track Override), MUST successfully complete the defined state sequence (S0 -> ... -> S4_PRE_INGRESS). Readiness is confirmed by the 'READY_FOR_INGRESS' flag activation and full **Artifact Verification Engine (AVE)** manifest conformance.

---

## 1. Proposal State Machine V2.1: Canonical Transitions

Transitions MUST be atomic, idempotent, cryptographically logged, and authorized. States SHALL ONLY proceed if the required transition condition is met.

| State ID | State Name | Transition Condition (MUST) | Next Valid States | GSEP-C Phase Link | Failure Path |
|:---|:---|:---|:---|:---|:---|
| S0 | INITIALIZED | P-ID assigned; Proposal Schema Validation complete; **Payload_Hash** locked. | S1, S_FAIL_STRUCTURAL | N/A | S_FAIL_STRUCTURAL |
| S1 | INTERNAL_PEER_REVIEW | Required_Approvals (N>=2) signed off; S-Agent Security Heuristics verified against current Protocol Layer. | S2, S_FAIL_STRUCTURAL | Internal Scrutiny (L-I) | S_FAIL_STRUCTURAL |
| S2 | EXTERNAL_AUDIT_QUEUE | Successful S1 passage; Audit_ID formally assigned and resource allocated. | S3_RUNNING, S_FAIL_STRUCTURAL | Resource Allocation (L-R) | S_FAIL_STRUCTURAL |
| S3_RUNNING | EXTERNAL_AUDIT_ACTIVE | Audit resource actively verifying integrity and compliance; Proof-of-Work started. | S3_PASS, S3_REWORK | Verification (L-V) | S_FAIL_CRITICAL |
| S3_REWORK | AUDIT_VIOLATION_REPAIR | External audit identified fixable violations. Rework constrained to remediation scope; Payload_Hash change permitted ONLY IF tracked and re-validated. | S3_RUNNING, S_FAIL_CRITICAL | Rework Loop (L-R) | S_FAIL_CRITICAL |
| S3_PASS | AUDIT_CLEAN | External Audit_Hash (signed report) validated and persisted. No open safety critical violations remain. | S4_PRE_INGRESS | Pre-Execution Artifact Signoff | S_FAIL_CRITICAL |
| S4_PRE_INGRESS | READY_FOR_INGRESS | AVE Manifest Conformance achieved; Target_SCI_Budget confirmed; All required signatures secured. Flag activated. | S5_EXECUTION | GSEP-C L0/L1 Trigger | S_FAIL_STRUCTURAL |
| S5_EXECUTION | DEPLOYED | GSEP-C L9 Final Audit Success; Result Artifact (D_Hash) persisted. | S_ARCHIVED | L9 EXIT/FINALIZED | S_FAIL_CRITICAL |
| S_FAIL_STRUCTURAL | FAILED_STRUCTURAL | Early failure (S0-S2, S4) due to configuration, schema violation, or insufficient peer sign-off. Activates RRP Level 1. | S_ARCHIVED | FAILED/RRP Level 1 | N/A |
| S_FAIL_CRITICAL | FAILED_CRITICAL | Failure (S3, S5) due to verified security risk, operational instability, or execution protocol failure. Activates RRP Level 2. | S_ARCHIVED | FAILED/RRP Level 2 | N/A |
| S_ARCHIVED | ARCHIVED | State maintained after definitive S5 or any S_FAIL termination. Data persisted. | N/A | SUCCESS/ARCHIVED | N/A |

## 2. Mandatory Immutable Proposal Artifacts (AVE Conformance)

The Artifact Verification Engine (AVE) MUST strictly enforce the presence and correctness of the following artifacts before authorizing S4 entry. These artifacts collectively form the canonical proposal manifest.

1.  **P_ID (Proposal Identifier):** Canonical, collision-resistant UUID (S0).
2.  **Originator_ID:** Identifier of the submitting Sovereign Agent (S0).
3.  **Proposal_Payload_Hash:** Cryptographic hash (e.g., SHA256) of the executed code/configuration payload. Must remain constant unless explicitly updated during S3_REWORK. (S0 Lock).
4.  **Required_Approvals:** List of signed peer authorizations confirming S1 passage (Min: 2).
5.  **Audit_ID:** Identifier of the external verification service (S2).
6.  **Audit_Hash (External):** Cryptographic signature/hash of the final external audit report (S3_PASS).
7.  **Target_SCI_Budget:** Maximum computational budget allocated for GSEP-C L3, specified in discrete Sovereign Compute Units (SCI).
8.  **Transition_Log_Hash:** A Merkle root hash linking all preceding entries in the Transition_Log, ensuring log immutability and sequence integrity (required for every state change).
