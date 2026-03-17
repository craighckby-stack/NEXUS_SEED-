/**
 * Optimized Gating Runner Tool Kernel interface and associated data structures
 * focusing on computational efficiency, concurrency, and recursive abstraction
 * within the governance integrity framework.
 */

// --- Type Aliases ---

/**
 * Standardized interface for runtime data passed during check execution.
 * Uses Readonly to enforce context immutability during check execution.
 */
export type IGovernanceExecutionContext = Readonly<Record<string, any>>;


// --- Data Structure Definitions ---

/**
 * Definition of a single integrity check within the GICM (Gating Integrity Check Manifest).
 * Type 'recursive' implies checks must handle nested subChecks.
 */
export interface GatingCheck {
    checkId: string;
    type: 'static' | 'dynamic' | 'recursive' | 'policy';
    criteria: Record<string, any>;
    weight?: number; // Used for scoring contribution
    subChecks?: GatingCheck[];
}

/**
 * The Gating Integrity Check Manifest (GICM) structure.
 */
export interface GatingCheckManifest {
    id: string;
    version: string;
    description: string;
    checks: GatingCheck[];
}

/**
 * Optimized structure for conveying the result of a single check.
 * Designed for low allocation overhead.
 */
export interface GatingCheckResult {
    checkId: string;
    passed: boolean;
    score: number; // Contribution score
    details: string;
    timestamp: number;
    isCached?: boolean; // Indicates if the result was memoized
}

// --- Service Interface Definition ---

/**
 * Defines the core contract for the Gating Runner Tool Kernel.
 * This kernel is responsible for executing Gating Integrity Check Manifests (GICMs),
 * managing concurrency, recursion, and memoization for integrity checks.
 */
export interface IGatingRunnerToolKernel {

    /**
     * Executes the full GICM, coordinating concurrent execution of root-level checks.
     * @param manifest The GICM to process.
     * @param context Runtime execution context.
     * @returns A promise resolving to all resulting check outcomes.
     */
    runGICM(
        manifest: GatingCheckManifest,
        context: IGovernanceExecutionContext
    ): Promise<GatingCheckResult[]>;

    /**
     * Executes a single GatingCheck definition, handling recursion and memoization internally.
     * @param check The check definition.
     * @param context Runtime context.
     * @param depth Current recursion depth (for guarding/optimization).
     * @returns A promise resolving to the result of the check.
     */
    executeCheck(
        check: GatingCheck,
        context: IGovernanceExecutionContext,
        depth?: number
    ): Promise<GatingCheckResult>;

    /**
     * Utility method to compute the canonical hash key for a check execution, aiding in memoization.
     * This key must uniquely identify the check definition and the immutable state slice from the context.
     */
    computeCanonicalKey(check: GatingCheck, context: IGovernanceExecutionContext): string;
}
