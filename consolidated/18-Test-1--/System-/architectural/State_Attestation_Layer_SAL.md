# State Attestation Layer (SAL) Protocol V2.0: Attestation Proof Engine

## M.0 MISSION: Integrity Proof Generation and Non-Repudiation Guarantee

The SAL protocol is the mandatory, immutable persistence boundary responsible for generating and anchoring **Attestation Proofs** for all SGS Core finalized states (S8), policy updates (PEUP), and audit artifacts. SAL ensures cryptographic immutability by leveraging an independent, verifiable ledger system, thereby guaranteeing Non-Repudiation Proof Chains (NRPC).

## 1.0 ARCHITECTURAL CONTEXT AND ARTIFACTS

1.  **Input Domain:** Artifacts finalized by Stage S8 (Audit/Finality), and all PEUP transactions.
2.  **Mandatory Dependencies:**
    *   CALS: Defines the Canonical Audit Log Schema for input validation.
    *   CRoT: Manages the active Cryptographic Root of Trust signing keys.
    *   GATM: Provides the Global Atomic Time Mechanism for temporal integrity constraints.
3.  **Output Artifact:** The **Attested State Object (ASO)**, formally defined in `ASO_Schema.json`.

## 2.0 ATTESTATION LIFE CYCLE (ALC)

For any input payload $P$ intended for permanent attestation, the SAL executes the following atomic, sequenced operations:

1.  **P-Validation (CALS Conformity):** Verify $P$ against the mandatory CALS structure. Failure halts the process.
2.  **Temporal Integrity Locking (GATM Constraint):** $P$ is enriched with a GATM-verified timestamp $T$. This binds $P$ to a verifiable time context.
3.  **Cryptographic Signing (CRoT Key):** The combined object $(P \| T)$ is digitally signed using the active CRoT key, yielding the signature $S_{CRoT}$. The resultant intermediate object is $P_{Attested} = \{P, T, S_{CRoT}\}.
4.  **Ledger Commitment & Anchoring:** $P_{Attested}$ is submitted to the dedicated immutable persistence layer (Cryptographic Ledger). Upon successful inclusion, the layer returns the verifiable $H_{anchor}$ (Merkle Root or Hash Graph Index).
5.  **ASO Finalization:** The Attested State Object (ASO) is finalized, encapsulating $P_{Attested}$ and $H_{anchor}$. The generation of $H_{anchor}$ is the final confirmation of S8 completion and PEUP finality.

## 3.0 INTEGRITY PROOF VERIFICATION & EXPOSURE

SAL guarantees *Public Verifiability*. All finalized ASOs must be verifiable against the chain of trust established by CRoT and the persistence ledger.

The SAL Verification Endpoint must permit:
1.  **Anchor Retrieval:** Proof generation for any ASO back to its specific $H_{anchor}$.
2.  **Proof Chain Reconstruction:** Recalculating the full cryptographic inclusion path proving the ASO's presence in the historical integrity root, accessible externally without requiring primary SGS state machine access.
