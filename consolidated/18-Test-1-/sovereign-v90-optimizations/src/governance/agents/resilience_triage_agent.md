# Agent Specification: Resilience Triage Agent (RTA) V1.1

## 1.0 CORE MANDATE & OPERATIONAL ISOLATION
The Resilience Triage Agent (RTA) is a read-only, attested state interpretation subsystem operating exclusively within the Sovereign Governance System's (SGS) Integrity Preservation Layer.

The RTAâs exclusive mandate is to execute an isolated, non-mutating assessment following a verified `STATUS: CRITICAL_FAILURE` signal. Its output is the `Signed Recovery Directive (SRD)` enforcing policy constraints defined in the `Governance Resilience Definition Manifest (GRDM)`.

**Non-Execution Principle:** The RTA executes the assessment protocol ($\Psi_{A}$), but is explicitly forbidden from execution promotion: $\Psi_{A} \nRightarrow \Psi_{N+1}$. It directs the subsequent SGS execution rollback.

## 2.0 ACTIVATION, ARTIFACTS, AND POLICY REFERENCE

### 2.1 Activation Event
RTA activation is mandatory and synchronous upon SGS receiving the validated `CRITICAL_FAILURE_EVENT` artifact. This artifact replaces the vague `STATUS: CRITICAL_FAILURE` signal.

| Field | Type | Description |
| :--- | :--- | :--- |
| `event_id` | UUID | Unique identifier for the failure epoch. |
| `timestamp` | UTC_Z | Time of failure verification. |
| `stage_id` | String | Failed core pipeline stage (e.g., S3: Planning Engine). |
| `FVR_payload` | Object | Comprehensive Failure Vector Report payload. |

### 2.2 Input Artifacts
1.  **Certified Intermediate State Manager (CISM) Snapshot ($S_{CISM}$):** The last globally committed, atomic state preceding the activation timestamp. Retrieved immutably.
2.  **Governance Resilience Definition Manifest (GRDM):** The actively certified and attested policy ruleset. Defines `FailureVector` maps to precise `RecoveryStrategy` commands and State Target calculations. The structure must conform to the mandated schema (`grdm_schema.json`).
3.  **Failure Vector Report (FVR):** Detailed, categorized diagnostics providing the precise context necessary for GRDM policy resolution (e.g., `FailureType.T: DATA_CORRUPTION`, `Severity.L: L1`).

### 2.3 Output Artifact: Signed Recovery Directive (SRD)
The SRD is a non-repudiable instruction issued to the SGS Recovery Module. It encapsulates the precise state transition mandate.

## 3.0 ATOMIC TRIAGE PROTOCOL (ATP)

The RTA must execute the following sequence as a fast, isolated transaction, relying solely on read access to locked inputs. This replaces the less formal "Transactional Triage Sequence."

1.  **Isolation Barrier Activation:** SGS enforces a global write lock on the CISM and all persistent state managers. RTA confirms immutable read access to $S_{CISM}$.
2.  **Policy Constraint Resolution (PCR):** RTA digests the FVR inputs ($StageID, FailureType, Severity$) and resolves the corresponding prescriptive policy block within the GRDM, using the established schema logic. The resulting command is $P_{Resolved}$.
3.  **Recovery State Target (RST) Calculation:** RTA applies $P_{Resolved}$ (which dictates lookback depth/strategy) against $S_{CISM}$ to calculate the exact Attested Recovery State Target ($RST_{T}$). This calculation is deterministic and complies strictly with GRDM safety invariants.
4.  **GAX Policy Attestation:** RTA submits the triplet ($P_{Resolved}$, $FVR$, $RST_{T}$) to the Governance Attestation X-unit (GAX). GAX verifies that $RST_{T}$ is the only possible compliant target based on the $P_{Resolved}$ mandate. Success yields a cryptographic policy signature ($\Sigma_{RST}$). Failure triggers immediate Integrity Hard Halt (SIH).
5.  **SRD Generation & Broadcast:** The RTA packages the SRD containing $RST_{T}$, $\Sigma_{RST}$, and the activation context. The SRD is cryptographically signed by the RTA's private key ($\Sigma_{RTA}$). SRD is issued to the SGS Recovery Module.
6.  **Immutable Event Logging (NRALS):** The RTA ensures that the complete ATP transaction artifact (Input Events, $P_{Resolved}$, $RST_{T}$, SRD payload) is permanently logged via the Non-Repudiable Attested Log System (NRALS) before the global isolation lock is released.

## 4.0 INTEGRITY AND SELF-GOVERNANCE

The RTA is a CRoT (Chain-of-Trust) anchored component. Its policy execution environment and policy interpreter must maintain zero-deviation compliance. Any runtime scenario where the RTA attempts to bypass GAX attestation, generate a non-compliant $RST_{T}$, or violate CISM read-only access will immediately trigger a terminal, unrecoverable System Integrity Hard Halt (SIH), pending human/attested autonomous intervention.
