/**
 * sovereign-agi/governance/GatingRunnerService.interface.ts
 * Defines the required execution interface for interpreting Gating Integrity Check Manifests (GICM).
 */

import { GatingIntegrityCheckManifest, GatingCheckItem } from "./GatingIntegrityCheckManifest.schema";

export interface GatingCheckResult {
    check_id: string;
    status: 'PASS' | 'FAIL' | 'UNRESOLVED';
    actual_value: any;
    expected_value: any;
    elapsed_ms: number;
    enforced_policy: 'HALT' | 'LOG_AND_PROCEED' | 'SILENT_DEGRADE';
    error?: string;
}

export interface GatingRunnerService {
    /**
     * Executes all checks defined in the GICM and returns a comprehensive report.
     * If a critical veto is triggered or failure_policy mandates HALT, the promise should reject/throw.
     *
     * @param manifest The executable Gating Integrity Check Manifest.
     * @returns A list of resolved check results.
     */
    executeChecks(manifest: GatingIntegrityCheckManifest): Promise<GatingCheckResult[]>;

    /**
     * Resolves the actual value from the source defined in a single GatingCheckItem.
     */
    resolveActualValue(item: GatingCheckItem): Promise<any>;
}