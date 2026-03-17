# METRIC OUTPUT SPECIFICATION (MOS)

## MOS V1.0 | METRIC SCOPE: L3 (S-01/S-02)

---

### 1. PURPOSE & SCOPE

The Metric Output Specification (MOS) defines the mandatory, deterministic schema required for all metric artifacts generated during the Governance Evolution Protocol (GSEP) L3 Dynamic Metric Synthesis stage (SEM/SDR). Compliance with MOS V1.0 is mandatory for successful L3 finality.

### 2. CORE ARTIFACT SCHEMA (L3 OUTPUT)

This schema dictates the format and constraint bounds for the core metrics consumed by the LCR (L4) and GCO (L5) to determine P-01 outcome.

| Field Name | Type / Format | Units / Constraint Bounds | Description |
|:-----------|:--------------|:--------------------------|:--------------|
| **S-01** | `Float64` | `[0.0, 1.0]` (Efficacy Units) | Quantified probability of successful mission outcome, based on SEM projection. |
| **S-02** | `Float64` | `[0.0, 1.0]` (Risk Units) | Aggregate exposure to defined risk vectors, recorded by SDR. |
| `DSP-C_Ref`| `String` (TXID) | Mandatory Linking | Reference transaction ID for the governing DSP-C scope utilized. |
| `L3_Timestamp`| `ISO 8601` | Mandatory | Finality timestamp of the L3 synthesis simulation run. |

### 3. COMPLIANCE REQUIREMENT

If the metrics produced by SEM/SDR do not conform strictly to the MOS V1.0 schema, GSEP L3 MUST fail and trigger GFRM (Governance Failure and Rollback Mechanism) activation, regardless of S-01/S-02 values.