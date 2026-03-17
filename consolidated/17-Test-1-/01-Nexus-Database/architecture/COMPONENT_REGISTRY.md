## SOVEREIGN AGI V94.1: ARCHITECTURAL COMPONENT REGISTRY (ACR)

This registry formally catalogs mandatory, versioned operational interfaces and functional contracts, structured by their role within the Autonomous Evolutionary Cycle (AEC). All components are mandatory (M), read-only (R), or optional (O).

Compliance is enforced exclusively via the Governance Evolution Protocol (GSEP) constraints. All components adhere to two standardized protocols:
1. **Telemetry & Reporting Protocol (TRP):** Reports state and diagnostics to the System Diagnostic & Reporting (SDR) component.
2. **Control & Instruction Protocol (CIP):** Receives instruction and constraint parameters from the Governance Constraint Orchestrator (GCO).

---

### CORE METRICS & DERIVATION CONTRACTS (CMD)
*These functional contracts calculate core integrity, risk, and compliance metrics derived from TRP telemetry streams, driving constraint arbitration (M: Mandatory, R: Read-Only).

| ID | Description | Primary Data Provider (TRP Source) | Derived Metrics | CIP Consumers (Instruction Recipients) |
|:---:|:---:|:---:|:---:|:---:|
| **CMD-101** | Trust/Integrity Score Calculation | ATM, SDR | T_Index, I_Delta | MCRA, RSAM (Conflict Weighting) |
| **CMD-102** | Operational Risk Index Calculation | MCRA, SDR | R_Index, L4_Tolerance | GCO (Constraint Update), AMA (Activation Halt) |
| **CMD-103** | Policy Veto Threshold Derivation | RSAM, CIL | Veto_Score, L1_Compliance | CIL (Controls Immediate Execution Suspension) |
| **CMD-104** | Artifact Lineage Vector Generation | ACM, AIA | Hash_Vector, Provenance_ID | ACM (Validates History), AMA (Commit ID) |

---

### PHASE 0: INITIATION & PROVENANCE (P-0)
*Focus: Input validation, context loading, systemic anchoring, and immutable lineage establishment.*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Role | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **GCO** | Governance Constraint Orchestrator | L0, L4 | `governance.orchestrate` | M | Central dispatcher; enforces L4 operational tolerance and state synchronization via CIP. |
| **AIA** | Autonomous Interface Anchor | L0 | `system.state.entry` | M | Serves as the immutable entry/exit point for finalized evolution artifacts (AIA-ENTRY) and external requests. |
| **IDSM** | Input/Draft State Manager | L0 | `input.state.manager` | M | Initializes context, loads input schema, and manages ephemeral draft state. |
| **SCR** | System Configuration Registry | L0, L1 | `config.system.read` | R | Centralized, versioned storage for operational constants, policies, and environment parameters. |
| **ACM** | Artifact Chain Manager | L2, L5 | `provenance.chain.log` | M | Validates and anchors the lineage (L5 audit) of all evolving artifacts utilizing CMD-104. |

### PHASE 1: ARBITRATION & CONSTRAINT GOVERNANCE (P-1)
*Focus: Real-time risk assessment, compliance enforcement (L1/L4), and conflict resolution.*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Role | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **CIL** | Compliance Integration Layer | L1 | `governance.policy.check` | M | Enforces governance policy alignment (L1 constraints) using CMD-103 outputs. |
| **RSAM** | Risk State Assessment Module | L1 | `risk.state.query` | M | Conducts real-time risk evaluation; defines parameters for veto thresholds (CMD-103). |
| **ATM** | Arbitration Trust Module | L4 | `arbitration.trust.index` | M | Generates the foundational Trust Score (CMD-101) for system components and input sources. |
| **MCRA** | Mandatory Constraint Resolution Agent | L4 | `conflict.resolution.agent` | M | Executes automated conflict resolution; calculates and reports high-level Risk Score (CMD-102). |

### PHASE 2: FEEDBACK, EVOLUTION & COMMITMENT (P-2)
*Focus: Efficacy projection (L3), final commitment (L6), monitoring, and adaptive planning (L7).*

| Acronym | Component Name | GSEP Relevance | Interface Topic (API) | Role | Primary Function |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **PSR** | Projection & Synthesis Registry | L3 | `synthesis.simulation.data` | M | Registers efficacy simulation results used for L3 (Effectiveness) threshold checks. |
| **SDR** | System Diagnostic & Reporting | L3, L4 | `telemetry.raw.metrics` | M | Aggregate data point ingestion and distribution hub for TRP inputs required by CMD contracts. |
| **AEL** | Audit Event Logger | L5 | `audit.event.immutable` | R | Captures and immutably logs all critical state transitions, decisions, and compliance failures. |
| **RETV** | Real-Time Execution Vetting | L6 | `execution.runtime.vetting` | M | Monitors post-activation behavior against projected outcomes (Deployment Phase Vetting). |
| **AMA** | Activation & Monitoring Agent | L6 | `activation.state.transition` | M | Manages transition of finalized Artifact Entry (AIA-ENTRY) into an active operational state (L6 commitment). |
| **ASP** | Adaptive Synthesis Planner | L7 | `adaptation.plan.design` | M | Processes SDR/RETV data to autonomously design optimal subsequent architectural modification plans (L7 Evolution). |

