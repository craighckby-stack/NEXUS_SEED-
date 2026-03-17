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

// Existing Interfaces (refined)
export interface PolicyEngine { 
    blockPipeline(identifier: string): Promise<void>; 
}

export interface AlertingService { 
    sendAlert(alert: { severity: CheckSeverity | string, message: string, context?: Record<string, unknown> }): Promise<void>; 
}

// New Core Utility
export interface Logger {
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, context?: Record<string, unknown>): void;
}

// New Governance Utility for mandatory tracking
export interface RemediationService {
    /**
     * Initiates external tracking (e.g., ticketing system, automated fix pipeline) for required mitigation actions.
     * @param entityIdentifier The entity requiring mitigation.
     * @param requiredActions Detailed list of steps or descriptions needed for remediation.
     * @returns A tracking identifier (e.g., Jira ticket ID).
     */
    initiateMitigation(entityIdentifier: string, requiredActions: string[]): Promise<string>;
}