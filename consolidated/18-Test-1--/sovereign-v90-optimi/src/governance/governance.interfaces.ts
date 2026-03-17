export enum AuditStatus {
    PASS = 'PASS',
    FAIL = 'FAIL',
    CONDITIONAL = 'CONDITIONAL',
}

export enum CheckSeverity {
    CRITICAL = 'CRITICAL',
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
    INFO = 'INFO',
}

// Interfaces refactored to high-integrity Tool Kernels (I...ToolKernel)
// The synchronous PolicyEngine interface is removed; pipeline blocking/veto logic is handled
// by VetoTriggerEvaluationKernel acting on outputs from IConceptualPolicyEvaluatorKernel.

/**
 * Tool Kernel for sending structured alerts and notifications to external systems.
 * Replaces the generic AlertingService, ensuring strong typing and auditable context.
 */
export interface IAlertingToolKernel { 
    sendAlert(alert: { 
        severity: CheckSeverity, 
        message: string, 
        context?: Record<string, unknown> 
    }): Promise<void>; 
}

/**
 * The mandated high-integrity asynchronous Logger Tool Kernel.
 * Replaces the synchronous Logger utility, adding the critical 'veto' logging path.
 */
export interface ILoggerToolKernel {
    info(message: string, context?: Record<string, unknown>): Promise<void>;
    warn(message: string, context?: Record<string, unknown>): Promise<void>;
    error(message: string, context?: Record<string, unknown>): Promise<void>;
    /** Logs a critical policy violation that results in a system VETO. */
    veto(message: string, context?: Record<string, unknown>): Promise<void>;
}

/**
 * Tool Kernel for initiating and tracking external mitigation and remediation actions.
 * Replaces the generic RemediationService, mandating structured audit context for tracking.
 */
export interface IRemediationTrackingToolKernel {
    /**
     * Initiates external tracking (e.g., ticketing system, automated fix pipeline) for required mitigation actions.
     * @param mitigationContext Structured context for the remediation, mandating auditability (conceptId, entityIdentifier, severity).
     * @param requiredActions Detailed list of steps or descriptions needed for remediation.
     * @returns A tracking identifier (e.g., Jira ticket ID or internal tracking ID).
     */
    initiateMitigation(
        mitigationContext: { conceptId: string, entityIdentifier: string, severity: CheckSeverity }, 
        requiredActions: string[]
    ): Promise<string>;
}