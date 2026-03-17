# Certified Intermediate State Manager (CISM) V1.0

## 1.0 MANDATE
The CISM provides non-repudiable state persistence for intermediate variables generated and consumed across the GSEP-C pipeline, guaranteeing atomic data lineage (S4) and data immutability between certified stages.

## 2.0 INTEGRATION REQUIREMENTS

### 2.1 State Object Definition
CISM operates exclusively on the `Transition_Delta` object, which encapsulates all necessary intermediate variables (Inputs, Model Results, Policy Flags) required for subsequent stages.

### 2.2 Core Functions
1. `CISM.Write(stage_N, Transition_Delta)`: Cryptographically commits the delta structure. Requires CRoT HMAC authorization.
2. `CISM.Read(stage_N+1)`: Retrieves the attested delta object committed by the preceding stage.
3. `CISM.VerifyChain(stage_N, stage_N+1)`: Confirms hash-chain continuity between sequential stage commitments.

## 3.0 GSEP-C Commitments

| Stage | Commitment Type | Function |
|:---|:---|:---|
| S1 | WRITE/LOCK | Commits sanitized ingress data (Input Lock). |
| S5 | WRITE/ATTEST | Commits model preparation state. |
| S7 | WRITE/FINAL CALCULUS | Commits S01 and S02 for S8 Veto assessment. |
| S9 | READ/AUDIT | Provides all certified deltas for NRALS logging prior to S10 attestation. |
