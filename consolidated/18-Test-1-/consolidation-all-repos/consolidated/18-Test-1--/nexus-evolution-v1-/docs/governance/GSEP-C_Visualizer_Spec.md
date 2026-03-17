# GSEP-C Visualization and Debug Interface (G.VDI) Specification

## 1.0 PURPOSE AND SCOPE

The G.VDI defines the certified visualization and interrogation layer for the GSEP-C protocol (Ref SGS 3.0). Its primary purpose is to provide real-time, validated state monitoring, especially during CRITICAL (RRP) or potential TERMINAL (SIH) failure events, ensuring the SGS agent can perform effective triage and VRRM execution.

## 2.0 CORE FUNCTIONALITY REQUIREMENTS

### 2.1 Real-Time Stage Visualization

1.  **Ingress:** Must consume and dynamically render the state of the GICM (Governance Inter-Agent Commitment Manifest) and ECVM (Execution Context Verification Manifest).
2.  **Progress Tracking:** Must display the GSEP-C pipeline as a sequential, 11-stage flow, marking current, passed, and pending stages.

### 2.2 Veto Gate Diagnostics (RRP Triage)

Upon encountering a CRITICAL failure (S2, S3, S4, S4.5, S6, S6.5, S6.7, S8):

1.  The visualization must immediately halt on the failed stage (N).
2.  It must provide a concise, high-priority alert detailing the specific axiomatic constraint violation (e.g., 'S3 Failure: Stability Bounds Check Violated').
3.  The interface must link directly to the relevant GAX constraint manifest (e.g., PVLM, MPAM, ADTM, CFTM) entry that dictated the failed constraint condition. 
4.  It must dynamically render the contents of the associated VRRM entry for immediate rollback/triage analysis.

### 2.3 P-01 Calculus Inspection

For Stage S8 failures, the G.VDI must render the components of the Formal Governance Calculus (Ref 2.1) in a human/agent readable format, allowing comparison of $S_{01}$, $S_{02}$, and $\epsilon$ against the axiomatic integrity constraints ($V_i$ Status).