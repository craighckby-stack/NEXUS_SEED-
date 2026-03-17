// GACMS_Definitions.js: Definitions for Governance Asset Change Management Service Protocol (GACMS)
// Refactored from governance/GACMS_protocol.md specification into executable configuration structures.

const GACMS_ARTIFACTS = {
  ACAL: "Asset Change Audit Log: Immutable ledger for finalized, signed Asset Change Manifests (ACMs).",
  ACM: "Asset Change Manifest: Bundle containing A_next, signed Attested Impact Report (Σ_AIR), and multi-agent cryptographic signatures (Σ_SGS, Σ_GAX, Σ_CRoT).",
  TPVS: "Temporal Policy Versioning Service: Manages real-time mapping of attested Asset Hashes to GSEP-C activation schedules."
};

const IATP_STAGES = [
  { id: 1, name: "STATE INITIATION", source: "SGS", target: "CALS", mandate: "Generate Proposal Hash (PH), validate structural schema, log PH and metadata." },
  { id: 2, name: "AXIOMATIC IMPACT ASSESSMENT", source: "GAX", target: "ACPE", mandate: "Execute formal proofs. Produce Attested Impact Report (AIR) certifying Axiomatic Coherence and Temporal Sensitivity (Δε)." },
  { id: 3, name: "INTEGRITY ATTESTATION", source: "CRoT", mandate: "Verify ACPE hash, sign AIR (Σ_AIR) certifying computational trustworthiness." },
  { id: 4, name: "CONSENSUS LOCK AND MANIFESTATION", source: "GAX/SGS", mandate: "Grant policy approval (GAX) based on Σ_AIR, perform final sign-off (SGS), compile Asset Change Manifest (ACM)." },
  { id: 5, name: "IMMUTABLE COMMITMENT", source: "CRoT", target: "ACAL", mandate: "Sign finalized ACM (Σ_ACM) and persist to ACAL." },
  { id: 6, name: "ZERO-TRUST ACTIVATION", source: "SGS/GSEP-C", mandate: "Load attested ACM. Update TPVS. Conditional activation based on GVDM integrity checks; failure mandates instantaneous rollback." }
];

module.exports = {
  GACMS_ARTIFACTS,
  IATP_STAGES,
  GOVERNANCE_REF: "GACMS V95.0 / IATP"
};