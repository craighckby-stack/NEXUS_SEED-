# 1. ARBITER: Delta Computation Module (DCM)

## 1.1 Mission & Context
The DCM is a high-assurance, mathematical utility dedicated to identifying and calculating variance between operational metrics (D-02 Telemetry) and cryptographically sealed committed states (D-01 Artifacts). It serves as the analytical backend for the AIA Query Engine (AQE).

## 1.2 Core Specification

### 1.2.1 Input Data Schema
1.  **Committed State Vector (`V_COM`):** Cryptographically signed D-01 state artifact (retrieved by VSR/AQE).
2.  **Runtime Metric Vector (`V_RUN`):** Relevant D-02 telemetry bundle (sourced from PDFS/AQE).
3.  **Tolerance Profile (`P_TOL`):** Dynamic tolerance configuration defining acceptable thresholds for each key metric index.

### 1.2.2 Variance Calculation Algorithm
The DCM utilizes the following sequence:
1.  **Vector Normalization:** Aligning V_COM and V_RUN based on common metric indices and time stamps.
2.  **Cryptographic Integrity Check:** Confirming the signature validity of V_COM against the GCO Public Key Register.
3.  **Differential Calculation:** Calculating raw delta vector (`V_DELTA = V_RUN - V_COM`).
4.  **Tolerance Assessment:** Mapping `V_DELTA` against `P_TOL` to classify variance as nominal, alert, or critical discrepancy.

## 1.3 Output
*   **Delta Report Object (DRO):** A JSON object detailing:
    *   `Hash_Pair`: (D-01 V_HASH, D-02 Runtime ID)
    *   `Status`: (NOMINAL, DRIFT, ANOMALY)
    *   `Variance_Vector`: Detailed list of metrics exceeding `P_TOL`.
*   The DRO is immediately sent back to the AQE for formal reporting.