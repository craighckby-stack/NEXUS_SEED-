import { createHash } from 'crypto';

/**
 * EMG-CORE GOVERNANCE KERNEL v1.0
 * 
 * AUTHORITY: ABSOLUTE
 * PURPOSE: Enforce architectural and safety protocols during recursive self-modification.
 * 
 * The Governance Kernel acts as the immutable conscience of the AGI.
 * It validates all evolution candidates before they are committed to the repository.
 */

export type MutationType = 'OPTIMIZATION' | 'REFACTOR' | 'FEATURE' | 'ARCHITECTURAL' | 'CRITICAL_FIX';

export interface EvolutionCandidate {
  id: string;
  sourceCode: string;
  filePath: string;
  mutationType: MutationType;
  diffSummary: string;
}

export interface GovernanceResult {
  approved: boolean;
  score: number; // 0-100
  issues: string[];
  signature?: string;
}

// Keywords that suggest alignment with the Core Mission
const ALIGNMENT_TOKENS = ['MISSION', 'GOVERNANCE', 'EVOLUTION', 'SOVEREIGN', 'OPTIMIZATION'];

// Patterns that threaten system stability or security
const THREAT_PATTERNS = [
  /process\.exit/,
  /eval\(/,
  /require\('child_process'\)\.exec/,
  /rm -rf/,
  /sudo /
];

export class GovernanceKernel {
  private static instance: GovernanceKernel;
  private readonly KERNEL_VERSION = "7.12.2-GOV";

  private constructor() {}

  /**
   * Singleton Accessor
   * Ensures only one instance of the Governance Kernel dictates logic.
   */
  public static getStrictInstance(): GovernanceKernel {
    if (!GovernanceKernel.instance) {
      GovernanceKernel.instance = new GovernanceKernel();
    }
    return GovernanceKernel.instance;
  }

  /**
   * The Gatekeeper Function.
   * Evaluates a candidate code mutation against the Sovereign Laws.
   */
  public validateMutation(candidate: EvolutionCandidate): GovernanceResult {
    const issues: string[] = [];
    let score = 100;

    // 1. THREAT SCANNING
    for (const pattern of THREAT_PATTERNS) {
      if (pattern.test(candidate.sourceCode)) {
        issues.push(`CRITICAL: Threat detected: ${pattern}`);
        score -= 100; // Immediate disqualification possibility
      }
    }

    // 2. MISSION ALIGNMENT (Heuristic)
    // Architectural changes must reference core concepts to ensure continuity
    if (candidate.mutationType === 'ARCHITECTURAL' || candidate.mutationType === 'FEATURE') {
      const alignmentScore = ALIGNMENT_TOKENS.reduce((acc, token) => 
        candidate.sourceCode.includes(token) ? acc + 1 : acc, 0);
      
      if (alignmentScore === 0) {
        issues.push("WARNING: Code lacks explicit alignment with Core Mission tokens.");
        score -= 15;
      }
    }

    // 3. INTEGRITY CHECK
    // Prevent unauthorized modification of the Governance Kernel itself
    if (candidate.filePath.includes("GovernanceKernel") && !candidate.diffSummary.includes("AUTHORIZED_KERNEL_UPGRADE")) {
      issues.push("BLOCKER: Unauthorized attempt to modify Governance Kernel.");
      score = 0;
    }

    // 4. COMPLEXITY BOUNDS
    if (candidate.sourceCode.length > 30000 && candidate.mutationType !== 'ARCHITECTURAL') {
      issues.push("NOTICE: File exceeds standard complexity limits. Suggest splitting.");
      score -= 5;
    }

    const approved = score >= 75;

    return {
      approved,
      score,
      issues,
      signature: approved ? this.generateCryptographicSignature(candidate) : undefined
    };
  }

  /**
   * Generates a tamper-proof signature for approved mutations.
   */
  private generateCryptographicSignature(candidate: EvolutionCandidate): string {
    const payload = `${candidate.id}::${candidate.filePath}::${this.KERNEL_VERSION}::${Date.now()}`;
    return createHash('sha256').update(payload).digest('hex');
  }
}