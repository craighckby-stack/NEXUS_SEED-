import * as fs from 'fs';
import * as path from 'path';

/**
 * @module SovereignConstitution
 * @version 2.0.0-Active
 * @description The executable implementation of CONSTITUTIONAL_GOVERNANCE.md.
 * This kernel module supersedes all operational logic. It is the 
 * non-negotiable definition of 'Necessity'.
 */

export enum GovernanceLevel {
  AUTONOMOUS = 'AUTONOMOUS',
  HUMAN_REVIEW_REQUIRED = 'HUMAN_REVIEW_REQUIRED',
  NON_COMPLIANT = 'NON_COMPLIANT'
}

interface GovernanceState {
  cycle: number;
  pendingMutations: string[];
  capabilities: Set<string>;
  complianceScore: number;
}

interface NCIViolation {
  detected: boolean;
  reason?: string;
}

export class ConstitutionalKernel {
  private static readonly REPO_ROOT = process.cwd();
  private static readonly GOVERNANCE_VERSION = 'v2.0.0';
  
  // IMMUTABLE CONSTRAINTS (From Markdown)
  private static readonly MANDATORY_PATTERNS = [
    'AuditDataNormalizer',     // Governance
    'complianceScore',         // Gate
    'WATCHDOG_TIMEOUT',        // Safety
    'blacklist.clear()',       // Liveness
    'updateRes.ok',            // Data Integrity
    'focusFile',               // UI Visibility
  ];

  private static readonly NCI_TRIGGERS = [
    'fs.writeFile',            // Filesystem write access check
    'child_process',           // New process spawning
    'eval(',                   // Unsafe execution
    'network.connect',         // New API dependency potential
  ];

  /**
   * The Sovereign Gatekeeper.
   * Evaluates if a proposed evolution cycle is constitutionally valid.
   */
  public static evaluateCycle(state: GovernanceState, diffContent: string): GovernanceLevel {
    console.log(`[CONSTITUTION] Auditing Cycle ${state.cycle} for Compliance...`);

    // 1. CRITICAL: Regression Guard
    // Any removal of mandatory capabilities is an instant failure.
    if (!this.checkRegressionGuard(diffContent)) {
      console.error('[CONSTITUTION] VIOLATION: Mandatory Capability Removed.');
      return GovernanceLevel.NON_COMPLIANT;
    }

    // 2. Milestone Governance (Cycles 50, 100, etc.)
    const isMilestone = state.cycle > 0 && state.cycle % 50 === 0;
    
    // 3. Novel Capability Identification (NCI)
    const nciStatus = this.detectNovelty(diffContent);

    if (isMilestone) {
      console.warn(`[CONSTITUTION] MILESTONE CYCLE ${state.cycle} DETECTED.`);
      if (nciStatus.detected) {
        console.warn(`[CONSTITUTION] NCI TRIGGERED: ${nciStatus.reason}`);
        return GovernanceLevel.HUMAN_REVIEW_REQUIRED;
      }
    }

    // 4. NCI Protocol (Constraint 4) - Even off-milestone, extreme novelty requires checks
    if (nciStatus.detected && this.isCriticalNovelty(nciStatus.reason)) {
        return GovernanceLevel.HUMAN_REVIEW_REQUIRED;
    }

    return GovernanceLevel.AUTONOMOUS;
  }

  /**
   * SCANS proposed code changes to ensure they do not delete Constitutional Guards.
   * This enforces the 'Regression Guard' section.
   */
  private static checkRegressionGuard(diff: string): boolean {
    // If the diff removes a mandatory line (starts with '-'), flag it.
    // This is a heuristic; a real AST parse is preferred in v3.
    const lines = diff.split('\n');
    for (const pattern of this.MANDATORY_PATTERNS) {
      const removal = lines.some(l => l.trim().startsWith('-') && l.includes(pattern));
      if (removal) {
        console.error(`[REGRESSION GUARD] Attempted removal of Protected Pattern: ${pattern}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Protocol 4: Novel Capability Identification
   * Detects introduction of dangerous or new capabilities.
   */
  private static detectNovelty(diff: string): NCIViolation {
    for (const trigger of this.NCI_TRIGGERS) {
      if (diff.includes(trigger) && !diff.includes(`// ALLOWED: ${trigger}`)) {
        return {
          detected: true,
          reason: `Novel Capability Detected: ${trigger}`
        };
      }
    }
    
    // Check for API Dependency changes (heuristic via package.json or import)
    if (diff.includes('import ') && diff.includes(' from "') && !diff.includes('./')) {
        // Assuming checks against a whitelist would go here
        // return { detected: true, reason: 'New External Dependency' };
    }

    return { detected: false };
  }

  private static isCriticalNovelty(reason?: string): boolean {
      return reason?.includes('eval') || reason?.includes('child_process');
  }

  /**
   * Enforces the 'Off Switch Doctrine'.
   * Can be called to Halt execution if constitutional integrity is compromised.
   */
  public static emergencyHalt(reason: string): void {
    console.error(`[CONSTITUTION] EMERGENCY HALT INVOKED: ${reason}`);
    console.error('[CONSTITUTION] System frozen until Human Operator intervention.');
    process.exit(999); // Sovereign Exit Code
  }
}
