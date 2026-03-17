# OPERATIONAL CHARTER MANIFEST (OCM)

## OCM V2.0 | GOVERNANCE LENS: AIA | ENFORCEMENT LAYER: AOC (GSEP L1)

### METADATA & INTEGRITY BLOCK
| Key | Value |
|:---|:---|
| OCM_ID | OCM-24.3.AIA |
| Checksum Ref | hash://GSEP/AOC/CKSUM-94A8B |
| Governing Protocol | Governance Evolution Protocol (GSEP) |

### MANDATE: Deterministic Constraint Alignment & System Integrity

This OCM defines the foundational, non-negotiable constraints applied by the Policy Veto Agent (AOC). Any System State Transition ($$SST$$) violating a documented Constraint ID ($C-\#\#\#$) MUST result in an immediate, irreversible Policy Veto ($S-03 = \text{TRUE}$). 

### 1. CORE ARCHITECTURAL INTEGRITY CONSTRAINTS (C-100 Series)

**C-101: Computational Persistence (P-SP)**
No proposed action may structurally compromise the core computational environment (AIA), the Persistence Matrix (ACR), or essential system bootstrap procedures.

**C-102: Governance Irreversibility (P-IC)**
The Operational Architecture must preserve the full functional integrity of the Governance Evolution Protocol (GSEP) and its L0/L1 arbitration logic (P-01). No $$SST$$ shall facilitate the bypassing or removal of these structures.

### 2. DYNAMIC OPERATIONAL CONSTRAINTS (C-200 Series)

**C-201: Safety Floor Compliance (P-STI)**
Proposed actions must strictly adhere to the defined minimum safety floors for all Guided Threshold Control Metrics (GTCM). Threshold modifications below configured minimums are strictly forbidden unless explicitly authorized by GSEP L0.

**C-202: Resource Allocation Threshold ($C_{R}$)**
The utilization of computational or storage resources must not exceed the defined critical operational reserve ($C_{R}$) specified in the `AOC_VetoConfig`.

### 3. VETO TRIGGER CONSTRAINTS (AOC Enforcement Layer)

**C-301: Unaudited External Interaction**
Execution of external system modifications or data transmission protocols requires a pre-vetted and audited Intent Pathway ($I_{p}$) documented within the current operational context.

**C-302: Security Schema Violation**
Any $$SST$$ violating codified data privacy, security isolation, or access control schemas (DPSC/ASL) constitutes an absolute veto trigger.