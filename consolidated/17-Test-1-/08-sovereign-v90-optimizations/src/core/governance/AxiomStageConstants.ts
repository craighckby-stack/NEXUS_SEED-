/**
 * @file IAxiomStageConfigRegistryKernel.ts
 * @description Defines the interface for retrieving canonical stage identifiers
 *              for the Sovereign AGI Governance Pipeline (CRoT).
 * This replaces the synchronous constant file AxiomStageConstants.ts.
 */

import { Kernel } from '@strategic/Kernel';
import { ILoggerToolKernel } from '@tools/ILoggerToolKernel';
import { IConfigurationDeepFreezeToolKernel } from '@tools/IConfigurationDeepFreezeToolKernel';

// --- Public Types (Extracted from old file) ---

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

// --- Registry Interface ---

export interface IAxiomStageConfigRegistryKernel {
  /**
   * Retrieves the canonical map of all AGI Axiom Governance Pipeline stages.
   */
  getAxiomStages(): Readonly<Record<StageID, Readonly<StageDefinition>>>;

  /**
   * Retrieves a strictly ordered array of all canonical Stage IDs.
   */
  getStageIDs(): ReadonlyArray<StageID>;
}

// --- Configuration Data (Internalized) ---

const RAW_AXIOM_STAGES: Record<StageID, StageDefinition> = {
  S0: {
    name: "Initialization",
    description: "Transition commencement and ID generation."
  },
  S1: {
    name: "State Certification",
    description: "Certified input state artifact (Psi_N) hashing and commitment."
  },
  S2: {
    name: "Cost Modeling",
    description: "Execution of S02 Cost/Failure Profile Assessment."
  },
  S3: {
    name: "Policy Veto Gate",
    description: "Policy Compliance Verification."
  },
  S4: {
    name: "Stability Veto Gate",
    description: "Stability Analysis and Dynamic Range Check."
  },
  S4_5: {
    name: "Context Attestation",
    description: "Validation of external and environmental context parameters."
  },
  S6_5: {
    name: "Behavioral Divergence Veto",
    description: "Check against known divergence signatures and anomalous behavior."
  },
  S8: {
    name: "Axiom Execution (P-01)",
    description: "GAX computes P-01 decision (Utility > Cost + Epsilon)."
  },
  S9: {
    name: "NRALS Logging",
    description: "SGS records the transition outcome in the Non-Repudiable Audit Log System (NRALS)."
  },
  S10: {
    name: "GICM Finalization",
    description: "CRoT signs the Governance Inter-Agent Commitment Manifest (GICM)."
  },
  S11: {
    name: "State Commit",
    description: "Commitment of the next state artifact (Psi_N+1) prior to execution."
  }
};

// --- Registry Implementation ---

export class AxiomStageConfigRegistryKernel extends Kernel implements IAxiomStageConfigRegistryKernel {
  protected readonly name: string = 'AxiomStageConfigRegistryKernel';
  
  private _frozenStages!: Readonly<Record<StageID, Readonly<StageDefinition>>>;
  private _frozenStageIDs!: ReadonlyArray<StageID>;

  private deepFreezeTool: IConfigurationDeepFreezeToolKernel;
  private logger: ILoggerToolKernel;

  constructor(dependencies: {
    deepFreezeTool: IConfigurationDeepFreezeToolKernel; // New required tool for immutability
    logger: ILoggerToolKernel;
  }) {
    super();
    this.#setupDependencies(dependencies);
  }

  #setupDependencies(dependencies: {
    deepFreezeTool: IConfigurationDeepFreezeToolKernel;
    logger: ILoggerToolKernel;
  }): void {
    if (!dependencies.deepFreezeTool) {
      throw new Error(`${this.name}: Missing required dependency 'deepFreezeTool'.`);
    }
    if (!dependencies.logger) {
      // Synchronous console logging violation prevented by enforcing DI here.
      throw new Error(`${this.name}: Missing required dependency 'logger'.`);
    }
    this.deepFreezeTool = dependencies.deepFreezeTool;
    this.logger = dependencies.logger;
  }

  public async initialize(): Promise<void> {
    this.logger.debug(`${this.name}: Initializing Axiom Stage definitions...`);
    
    // 1. Freeze the main stage map using the injected tool
    this._frozenStages = this.deepFreezeTool.deepFreeze(RAW_AXIOM_STAGES) as 
        Readonly<Record<StageID, Readonly<StageDefinition>>>;

    // 2. Freeze the ID array
    const rawIDs: StageID[] = Object.keys(RAW_AXIOM_STAGES) as StageID[];
    this._frozenStageIDs = this.deepFreezeTool.deepFreeze(rawIDs);

    this.logger.info(`${this.name}: Successfully loaded and froze ${rawIDs.length} Axiom Stage definitions.`);
  }

  public getAxiomStages(): Readonly<Record<StageID, Readonly<StageDefinition>>> {
    if (!this._frozenStages) {
      throw new Error(`${this.name}: Configuration not initialized. Call initialize() first.`);
    }
    return this._frozenStages;
  }

  public getStageIDs(): ReadonlyArray<StageID> {
    if (!this._frozenStageIDs) {
      throw new Error(`${this.name}: Configuration not initialized. Call initialize() first.`);
    }
    return this._frozenStageIDs;
  }
}