export interface RotationScheduleConfig {
    /** The type of rotation policy (e.g., EPISODIC, TIME_BOUND). */
    type: 'EPISODIC' | 'TIME_BOUND' | 'TIME_CEILING' | string;
    /** Specific threshold for metric-based rotation (EPISODIC). */
    metricThreshold?: number;
    /** Duration in days/time units for time-based rotation (TIME_BOUND/TIME_CEILING). */
    timeThreshold?: number;
}

export interface RotationOutcome {
    /** True if rotation was triggered as a result of this metric report. */
    triggered: boolean;
    /** The reason code for triggering or not triggering the rotation. */
    reason: 'THRESHOLD_MET' | 'TIME_ELAPSED' | 'POLICY_VIOLATED' | 'NO_ACTION' | string;
    /** Optional identifier for the newly generated key version. */
    newKeyVersion?: string;
}

export interface CheckSummary {
    /** The number of domains checked during the time-bound run. */
    totalDomainsChecked: number;
    /** List of domainKeys for which rotation was successfully initiated. */
    rotatedDomainKeys: string[];
    /** List of errors encountered during the check. */
    errors: string[];
}

/**
 * @interface KeyRotationTriggerInterfaceKernel
 * Handles monitoring key usage metrics against rotation schedules 
 * defined in config/key_rotation_schedule.json and triggering 
 * mandatory key updates via the IKLM (Key Lifecycle Management) service.
 */
export interface KeyRotationTriggerInterfaceKernel {
    
    /**
     * Registers a new key domain rotation policy for active monitoring.
     * @param domainKey The unique identifier for the key domain (e.g., AASS-SK).
     * @param schedule The configuration object defining policy type and thresholds.
     */
    registerPolicy(domainKey: string, schedule: RotationScheduleConfig): Promise<void>;

    /**
     * Reports metrics for an EPISODIC rotation policy, potentially triggering rotation.
     * @param domainKey The key domain being reported against.
     * @param metricValue The current count of the operational metric (e.g., StateTransitionCount).
     */
    reportMetric(domainKey: string, metricValue: number): Promise<RotationOutcome>;

    /**
     * Runs periodic checks for all TIME_BOUND and TIME_CEILING policies. Should be scheduled daily.
     */
    runTimeBoundChecks(): Promise<CheckSummary>;
}