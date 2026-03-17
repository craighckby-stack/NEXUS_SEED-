# SYSTEM METRIC STANDARD (SMS V94.1)

## MANDATE: Verifiable P-01 Input Calculation

This document defines the mandatory methodology and structural constraints for the generation of $\mathcal{S-01}$ (Efficacy Projection) and $\mathcal{S-02}$ (Risk Synthesis). Adherence to SMS is strictly required by the SDR (System Diagnostic & Reporting) and HMC (Hazard Modeling Component) to ensure cryptographically auditable inputs for the L4 P-01 authorization calculus.

---

## 1. GENERAL REQUIREMENTS

1.  **Normalization Standard:** All metric inputs and outputs must adhere to the V1.1 Floating Point Normalization Standard (FPNS) for consistency within the L4 calculus.
2.  **Auditability:** Every metric computation must be accompanied by an input Vector Manifest (IVM) detailing the source dataset and algorithmic hash used for generation.
3.  **Real-Time Synchronization:** Metrics must reflect the current proposed SST state, generated *after* L3 Proving completion and *before* L4 Adjudication submission.

---

## 2. $\mathcal{S-01}$: EFFICACY PROJECTION REQUIREMENTS (SDR)

$\mathcal{S-01}$ must quantify the projected positive utility, weighted against the Mandated Strategic Objective (MSO).

*   **Formula Requirement:** Must use an optimized Monte Carlo simulation (MCS V3.0) model, projecting outcome distribution over a minimum of $10^5$ iterations.
*   **Primary Vectors:** Utility Gain Vector (UGV), Computational Efficiency Index (CEI), Resilience Increase Metric (RIM).
*   **Threshold:** The resulting $\mathcal{S-01}$ value must be strictly non-negative.

---

## 3. $\mathcal{S-02}$: RISK SYNTHESIS REQUIREMENTS (HMC)

$\mathcal{S-02}$ must quantify the potential operational, structural, and semantic hazard introduced by the SST.

*   **Formula Requirement:** Must use the Bayesian Structural Fault Analysis (BSFA V2.1) methodology.
*   **Primary Vectors:** Semantic Drift Index (SDI), State Corruption Potential (SCP), Resource Saturation Probability (RSP).
*   **Weighting:** $\mathcal{S-02}$ must apply a mandatory exponential weighting factor (WF=1.5) to any identified vector violating SBC constraints, even if minor.
