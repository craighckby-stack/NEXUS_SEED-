# 1. ARBITER: AIA Query Engine (AQE)

## 1.1 Mission & Context
The AIA Query Engine (AQE) is the dedicated, non-mutating forensic interface responsible for verifying operational integrity against the Atomic Immutable Architecture (AIA) ledger. Its primary mission is to correlate real-time operational telemetry (D-02 data) provided by the PDFS against committed, cryptographically secured state artifacts (D-01 data).

## 1.2 Core Specification and Functionality

The AQE operates exclusively in a read-only capacity, ensuring no transaction modification is possible.

### 1.2.1 Verifiable State Retrieval (VSR)
*   **Input:** Target AIA Version Hash (`V_HASH`) and optional timestamp range (`T_RANGE`).
*   **Output:** The fully committed D-01 state artifact (ledger entry), signed and hashed by the GCO.

### 1.2.2 Delta Reporting Interface (DRI)
*   **Purpose:** Orchestrates the comparison between received D-02 metrics and the retrieved VSR state.
*   **Mechanism:** Calls the Delta Computation Module (DCM) to execute high-fidelity variance calculation, identifying discrepancies (state drift, unauthorized metric deviation).

### 1.2.3 Audit Utility for GCO
*   Serves as the mandated inspection conduit for the Governance Core Observer (GCO) and internal auditors.
*   Confirms AIA integrity, validating the cryptographic chains of MCR transactions and overall state evolution.

## 1.3 System Integration and Dependencies

| Dependency | Interaction Type | Role |
|:---|:---|:---|
| AIA Ledger | R (Read-Only) | Source of D-01 committed state artifacts. |
| PDFS (PDS Filter System) | R (Read/Ingress) | Source of real-time D-02 operational telemetry. |
| **DCM** (Delta Computation Module) | R/W (Execute) | Calculates metric variance and generates formal Discrepancy Reports. |

## 1.4 G-LEX Register Update
The AQE is formally registered as a Level 5 Forensic Utility.
| Acronym | Functional Definition | Role Context |
|:---|:---|:---|
| **AQE** | AIA Query Engine | Provides read-only, high-speed forensic access to the AIA ledger for real-time audit correlation and VSR during Stage 6 Verification.