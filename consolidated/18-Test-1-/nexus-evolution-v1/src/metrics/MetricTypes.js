/**
 * Standardized constants for the 'metricType' field in audit logs.
 * Using constants prevents typos and ensures consistency across the system, 
 * improving system intelligence and reducing runtime classification errors.
 */
module.exports = {
    // Core Operational Metrics
    CALIBRATION_UPDATE: 'CALIBRATION_UPDATE',
    DECISION_EXECUTION: 'DECISION_EXECUTION',
    MODEL_INFERENCE: 'MODEL_INFERENCE',
    
    // System Health and Auditing
    SYSTEM_SHUTDOWN: 'SYSTEM_SHUTDOWN',
    ADAPTER_ERROR: 'ADAPTER_ERROR',
    QUEUE_FLUSH: 'QUEUE_FLUSH',
};