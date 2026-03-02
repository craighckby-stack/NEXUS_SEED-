# GSUP V94.1: GOVERNANCE SCHEMA UPDATE PROTOCOL

## 1.0 PURPOSE & SCOPE
The Governance Schema Update Protocol (GSUP) defines the atomic, CRoT-attested process necessary for modification of Trust Segment B validation schemas stored within the Policy Configuration Schema Repository (PCSR). This is a highly privileged, off-GSEP-C operation required to facilitate policy evolution without compromising the integrity attested by the Policy Configuration Schema Integrity Manifest (PCSIM).

## 2.0 PROTOCOL PHASES

The protocol requires sequential validation and commitment phases involving multiple independent governance systems to enforce multi-agent consensus before update deployment.

### Phase 1: Preparation & Submission (GAX Lead)
1.  **Schema Draft:** GAX generates proposed updates to PCSR (e.g., changes to PVLM schema constraints).
2.  **Version Lock:** Proposed schemas are cryptographically sealed with the anticipated new version (N+1) metadata.
3.  **Audit Review:** Independent auditing module (Oversight Committee, OC) signs off on semantic adherence and integrity via an OC-Signed Audit Log (**OCAL**).

### Phase 2: CRoT Attestation & Commitment
1.  **Integrity Hash Generation:** The entire updated PCSR payload is hashed ($\text{Hash}_{\text{PCSR}, N+1}$). 
2.  **PCSIM Update Request:** The hash and version N+1 metadata are submitted to CRoT for attestation.
3.  **CRoT Signing:** CRoT verifies the OCAL signature and context. Upon successful verification, CRoT cryptographically signs the new hash, generating the updated **PCSIM** ($\text{PCSIM}_{N+1}$). 
4.  **Distribution:** The $\text{PCSIM}_{N+1}$ and the attested PCSR N+1 package are distributed atomically to all PCTM instances and redundant storage layers.

### Phase 3: Activation & Verification (PCTM/SGS Lead)
1.  **Pre-Flight Check:** All governance agents (SGS, GAX) acknowledge receipt of the attested PCSIM and PCSR N+1 files.
2.  **Atomic Activation:** PCTM synchronously replaces the operational PCSR files with the attested N+1 package.
3.  **Self-Test:** PCTM immediately executes a self-verification run, re-hashing the newly active PCSR and comparing it against the received $\text{PCSIM}_{N+1}$.
4.  **Success Logging:** SGS logs the successful GSUP completion event into the Certified State Transition Ledger (CSTL), marking the $\text{PCSIM}_{N+1}$ as active for subsequent GSEP-C runs (S0).

## 3.0 FAILURE MODES

*   **PCSIM Mismatch:** If Phase 3, Step 3 fails (Hash mismatch), the PCTM immediately rolls back to the prior certified state ($\text{PCSR}_{N}$) and triggers a CRITICAL (RRP) failure event.
*   **CRoT Failure to Sign:** Protocol halts immediately. A **TERMINAL (SIH)** event is triggered if CRoT is unresponsive.