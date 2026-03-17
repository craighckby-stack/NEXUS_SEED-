/**
 * core/config/CriticalPaths.js
 * 
 * Defines non-negotiable, mission-critical file system paths and endpoints 
 * required by isolated system components (like IsolatedFailureReporter) immediately 
 * upon boot, independent of the main configuration system.
 */

export const CriticalPaths = {
    // Path used by IsolatedFailureReporter for synchronous, append-only security logging.
    ISOLATED_FAILURE_LOG: process.env.AGI_ISOLATED_LOG_PATH || '/var/log/agi/isolated_failures.log',
    
    // Path for the secure, read-only recovery script repository.
    RECOVERY_SCRIPTS_ROOT: '/etc/agi/recovery_scripts/',

    // Optional: Low-level telemetry endpoint (if synchronous network I/O is possible).
    SECURE_TELEMETRY_ENDPOINT: null,
};

// --- Initialization --- 
// This configuration must be loaded very early during the system bootstrap.
// The system startup should ensure these environment variables/paths are set and accessible.

if (CriticalPaths.ISOLATED_FAILURE_LOG) {
    const { IsolatedFailureReporter } = require('../system/IsolatedFailureReporter');
    IsolatedFailureReporter.setLogPath(CriticalPaths.ISOLATED_FAILURE_LOG);
}
