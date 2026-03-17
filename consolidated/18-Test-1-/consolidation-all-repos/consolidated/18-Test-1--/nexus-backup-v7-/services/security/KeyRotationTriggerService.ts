/**
 * @interface KeyRotationTriggerService
 * Handles monitoring key usage metrics against rotation schedules 
 * defined in config/key_rotation_schedule.json and triggering 
 * mandatory key updates via the IKLM (Key Lifecycle Management) service.
 */
export interface KeyRotationTriggerService {
    
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