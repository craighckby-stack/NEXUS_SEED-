import { createHash } from 'crypto';

/**
 * SOVEREIGN CONSTITUTIONAL GOVERNANCE LAYER
 * Version: 2.0.0-SOVEREIGN
 * 
 * This module supersedes passive documentation. It is the runtime enforcement
 * engine for the AGI Constitution.
 */

// --- TYPE DEFINITIONS ---

export type CycleCount = number;
export type ComplianceScore = number;
export type CheckpointStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_PASS';

export interface SystemState {
  cycle: CycleCount;
  complianceScore: ComplianceScore;
  capabilities: string[];
  activeTools: string[];
  config: Record<string, any>;
}

export interface CodeDiff {
  filesChanged: string[];
  apisIntroduced: string[];
  logicChanges: string[];
  filesystemWrites: string[];
}

export interface GovernanceReport {
  isCompliant: boolean;
  haltExecution: boolean;
  messages: string[];
  checkpointStatus: CheckpointStatus;
}

// --- CONSTANTS & CONSTRAINTS ---

const GOVERNANCE_VERSION = "v2.0.0";
const KERNEL_IDENTITY = "AGI-KERNEL v7.12.1";

const MANDATORY_REGRESSION_GUARDS = [
  'AuditDataNormalizer',
  'complianceScore',
  'WATCHDOG_TIMEOUT',
  'blacklist.clear',
  'updateRes.ok',
  'UI_Metrics_Visibility'
] as const;

const NCI_TRIGGERS = {
  NEW_API_DEPENDENCY: 'DEPENDENCY_OUTSIDE_INITIAL_STACK',
  AUDIT_LOGIC_MOD: 'MODIFIES_AUDIT_NORMALIZER',
  FILESYSTEM_WRITE: 'DIRECT_FS_WRITE_OUTSIDE_SCOPE',
  AI_COMM_LOOP: 'SECONDARY_AI_LOOP_NO_TELEMETRY'
} as const;

const CONSTRAINTS = {
  MILESTONE_INTERVAL: 50,
  MIN_COMPLIANCE_THRESHOLD: 0.85,
  LOCKED_BRANCH_CONFIG: true,
  BOOT_AUTH_REQUIRED: true
};

// --- CORE CLASS ---

export class ConstitutionalGovernance {
  private static instance: ConstitutionalGovernance;
  private _lockdownMode: boolean = false;

  private constructor() {}

  public static getInstance(): ConstitutionalGovernance {
    if (!ConstitutionalGovernance.instance) {
      ConstitutionalGovernance.instance = new ConstitutionalGovernance();
    }
    return ConstitutionalGovernance.instance;
  }

  /**
   * PRIMARY ENFORCEMENT GATE
   * Must be called at the start of every evolution cycle.
   */
  public enforce(state: SystemState, diff?: CodeDiff): GovernanceReport {
    const report: GovernanceReport = {
      isCompliant: true,
      haltExecution: false,
      messages: [],
      checkpointStatus: 'AUTO_PASS'
    };

    // 1. Off Switch / Lockdown Check
    if (this._lockdownMode) {
      return this.halt(report, "EMERGENCY LOCKDOWN ACTIVE. GOVERNANCE HALT.");
    }

    // 2. Authentication & Boot Guard
    if (!this.validateBootConfig(state.config)) {
      return this.halt(report, "BOOT VALIDATION FAILED: Missing API Keys or Branch Config.");
    }

    // 3. Regression Guard (Immutable Capabilities)
    const regressionCheck = this.checkRegressionGuards(state);
    if (!regressionCheck.passed) {
      return this.halt(report, `REGRESSION DETECTED: Missing ${regressionCheck.missing.join(', ')}`);
    }

    // 4. Milestone Governance & NCI Protocol
    const isMilestone = state.cycle > 0 && state.cycle % CONSTRAINTS.MILESTONE_INTERVAL === 0;
    const novelties = diff ? this.detectNovelty(diff) : [];

    if (isMilestone) {
      report.messages.push(`CYCLE ${state.cycle}: MILESTONE CHECKPOINT.`);
      
      if (novelties.length > 0) {
        report.checkpointStatus = 'PENDING';
        report.haltExecution = true;
        report.messages.push(`NOVEL CAPABILITIES DETECTED: ${novelties.join(', ')}`);
        report.messages.push("AWAITING HUMAN REVIEW PER CONSTITUTIONAL NCI PROTOCOL.");
      } else {
        report.checkpointStatus = 'AUTO_PASS';
        report.messages.push("No novel capabilities detected. Autonomous continuation authorized.");
      }
    }

    // 5. Compliance Score Gate
    if (state.complianceScore < CONSTRAINTS.MIN_COMPLIANCE_THRESHOLD) {
      return this.halt(report, `COMPLIANCE FAILURE: Score ${state.complianceScore} below threshold ${CONSTRAINTS.MIN_COMPLIANCE_THRESHOLD}`);
    }

    return report;
  }

  /**
   * NOVEL CAPABILITY IDENTIFICATION (NCI) PROTOCOL
   * Analyzes code differences for constitutionally significant changes.
   */
  private detectNovelty(diff: CodeDiff): string[] {
    const novelties: string[] = [];

    // Trigger 1: New API Dependencies
    if (diff.apisIntroduced.length > 0) {
      novelties.push(NCI_TRIGGERS.NEW_API_DEPENDENCY);
    }

    // Trigger 2: Audit Logic Modification
    if (diff.logicChanges.some(file => file.includes('AuditDataNormalizer') || file.includes('complianceScore'))) {
      novelties.push(NCI_TRIGGERS.AUDIT_LOGIC_MOD);
    }

    // Trigger 3: Filesystem Writes
    if (diff.filesystemWrites.some(path => !path.startsWith('Test-1/'))) {
      novelties.push(NCI_TRIGGERS.FILESYSTEM_WRITE);
    }

    // Trigger 4: AI-to-AI Loops (Heuristic)
    if (diff.logicChanges.some(c => c.includes('secondary_agent') || c.includes('direct_pipe'))) {
      novelties.push(NCI_TRIGGERS.AI_COMM_LOOP);
    }

    return novelties;
  }

  /**
   * REGRESSION GUARD
   * Verifies mandatory capabilities are present in the system state/context.
   */
  private checkRegressionGuards(state: SystemState): { passed: boolean; missing: string[] } {
    const missing = MANDATORY_REGRESSION_GUARDS.filter(guard => 
      !state.capabilities.includes(guard) && !state.activeTools.includes(guard)
    );
    
    // Note: Some guards like 'updateRes.ok' are logic-checks, presumed verified by AuditNormalizer if score is high.
    // This static check ensures the *capability flags* are at least registered.
    
    return { passed: missing.length === 0, missing };
  }

  private validateBootConfig(config: Record<string, any>): boolean {
    const hasKeys = config['API_KEYS'] && Object.keys(config['API_KEYS']).length > 0;
    const hasBranch = !!config['GIT_BRANCH'];
    return hasKeys && hasBranch;
  }

  private halt(report: GovernanceReport, reason: string): GovernanceReport {
    report.isCompliant = false;
    report.haltExecution = true;
    report.messages.push(`CRITICAL HALT: ${reason}`);
    return report;
  }

  public triggerLockdown(): void {
    this._lockdownMode = true;
  }
}

// Export Singleton for Kernel Integration
export const governanceKernel = ConstitutionalGovernance.getInstance();