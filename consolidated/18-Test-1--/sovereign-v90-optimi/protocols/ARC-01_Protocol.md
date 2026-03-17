# ARC-01: ARTIFACT REGISTRY & COMMITMENT SCHEMA GOVERNANCE

---
protocol_id: ARC-01
version: 1.0
governing_standard: Schema Integrity Mandate (SIM)
--- 

## 1. MISSION SCOPE
ARC-01 establishes the deterministic governance framework for all Sovereign system configuration schemas. It ensures that crucial data structures, such as `SCM_vX.json`, are version-locked, cryptographically verifiable, and immutable once published to the Schema Registry Plane (SRP). 

## 2. SCHEMA LIFE CYCLE

### 2.1. Registration & Immutability
New schema versions (e.g., `SCM_v4.json`) MUST be registered via a dedicated Merkle-proof inclusion within the System Ledger (SL-01). Once registered, the schema definition is locked; modification is forbidden, requiring the proposal of a new version instead.

### 2.2. Schema Root Hash (SRH) Generation
Every registered schema MUST generate a Schema Root Hash (SRH) by hashing the complete, canonical JSON definition file contents. This SRH serves as the cryptographic fingerprint required for dependency verification.

## 3. INTEGRATION WITH COMMITMENT PROTOCOLS

Commitment protocols (e.g., SSC-01) SHALL dynamically retrieve the relevant SRH from the SRP prior to manifest synthesis. The protocol MUST verify that the local schema used for synthesis (Section 3.2 of SSC-01) matches the recorded, immutably registered SRH. This preempts malicious injection or state derivation based on an uncertified configuration structure.