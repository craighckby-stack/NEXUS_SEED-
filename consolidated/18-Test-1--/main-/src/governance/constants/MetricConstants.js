/**
 * Global Constants for Standardized System Measurement Identifiers (IDs).
 * Ensures consistency across Monitoring, Telemetry, Governance, and Reporting systems.
 */
const MetricConstants = {
    // System Resource Utilization
    SYS_CPU_U: 'SYS_CPU_U',           // CPU Usage Percentage
    SYS_MEM_A: 'SYS_MEM_A',           // Available Memory Percentage
    SYS_DISK_IO: 'SYS_DISK_IO',       // Disk I/O Rate (MB/s)

    // Time & Synchronization
    SYS_CLOCK_S: 'SYS_CLOCK_S',       // Clock Skew in Milliseconds

    // Operational Metrics
    OP_TASK_Q_L: 'OP_TASK_Q_L',       // Pending Task Queue Length
    OP_LATENCY_AVG: 'OP_LATENCY_AVG', // Average Operational Latency (ms)

    // Health Status Indicators
    HEALTH_STATUS: 'HEALTH_STATUS'    // General System Health Status Code (0-100)
};

module.exports = MetricConstants;
