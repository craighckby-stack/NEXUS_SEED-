/**
 * @file AxiomStageConstants.ts
 * @description Provides strictly typed and frozen canonical stage identifiers
 *              for the Sovereign AGI Governance Pipeline (CRoT).
 * Derived from config/schemas/AxiomStageIDs.schema.json (V94.1).
 */

export type StageID =
  | 'S0'
  | 'S1'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'S4_5'
  | 'S6_5'
  | 'S8'
  | 'S9'
  | 'S10'
  | 'S11';

export interface StageDefinition {
  name: string;
  description: string;
}

export const AXIOM_STAGES: Readonly<Record<StageID, Readonly<StageDefinition>>> = Object.freeze({
  S0: Object.freeze({
    name: "Initialization",
    description: "Transition commencement and ID generation."
  }),
  S1: Object.freeze({
    name: "State Certification",
    description: "Certified input state artifact (Psi_N) hashing and commitment."
  }),
  S2: Object.freeze({
    name: "Cost Modeling",
    description: "Execution of S02 Cost/Failure Profile Assessment."
  }),
  S3: Object.freeze({
    name: "Policy Veto Gate",
    description: "Policy Compliance Verification."
  }),
  S4: Object.freeze({
    name: "Stability Veto Gate",
    description: "Stability Analysis and Dynamic Range Check."
  }),
  S4_5: Object.freeze({
    name: "Context Attestation",
    description: "Validation of external and environmental context parameters."
  }),
  S6_5: Object.freeze({
    name: "Behavioral Divergence Veto",
    description: "Check against known divergence signatures and anomalous behavior."
  }),
  S8: Object.freeze({
    name: "Axiom Execution (P-01)",
    description: "GAX computes P-01 decision (Utility > Cost + Epsilon)."
  }),
  S9: Object.freeze({
    name: "NRALS Logging",
    description: "SGS records the transition outcome in the Non-Repudiable Audit Log System (NRALS)."
  }),
  S10: Object.freeze({
    name: "GICM Finalization",
    description: "CRoT signs the Governance Inter-Agent Commitment Manifest (GICM)."
  }),
  S11: Object.freeze({
    name: "State Commit",
    description: "Commitment of the next state artifact (Psi_N+1) prior to execution."
  })
});

/**
 * A strictly ordered array of all canonical Stage IDs.
 */
export const AXIOM_STAGE_IDS: ReadonlyArray<StageID> = Object.freeze(
    Object.keys(AXIOM_STAGES) as StageID[]
);
