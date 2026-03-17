import { EnvVarResolver } from "#plugins/EnvVarResolver";

/**
 * Defines non-negotiable, mission-critical file system paths and endpoints 
 * required by isolated system components immediately upon boot, independent 
 * of the main configuration system.
 */

/**
 * Resolves a critical path value from environment variables or defaults
 * @param {string} envVar - The environment variable name to check
 * @param {string} defaultValue - The fallback value if env var is not set
 * @returns {string} The resolved path value
 */
const resolveCriticalPath = (envVar, defaultValue) => EnvVarResolver.resolve(envVar, defaultValue);

// Default path constants
const DEFAULT_LOG_PATH = '/var/log/agi/isolated_failures.log';
const DEFAULT_RECOVERY_SCRIPTS_ROOT = '/etc/agi/recovery_scripts/';

/**
 * Defines and freezes the mission-critical file system paths and endpoints
 * @returns {Readonly<Record<string, string|null>>} The frozen critical paths configuration
 */
const defineCriticalPaths = () => Object.freeze({
    // Path used by IsolatedFailureReporter for synchronous, append-only security logging
    ISOLATED_FAILURE_LOG: resolveCriticalPath('AGI_ISOLATED_LOG_PATH', DEFAULT_LOG_PATH),
    
    // Path for the secure, read-only recovery script repository
    RECOVERY_SCRIPTS_ROOT: DEFAULT_RECOVERY_SCRIPTS_ROOT,

    // Optional: Low-level telemetry endpoint (if synchronous network I/O is possible)
    SECURE_TELEMETRY_ENDPOINT: null,
});

/**
 * Initializes the IsolatedFailureReporter during system bootstrap
 * @param {Readonly<Record<string, string|null>>} paths - The resolved critical paths
 */
const initializeFailureReporterOnBootstrap = (paths) => {
    const logPath = paths.ISOLATED_FAILURE_LOG;
    if (!logPath) return;

    try {
        // Dynamic require is necessary due to early bootstrap context
        const { IsolatedFailureReporter } = require('../system/IsolatedFailureReporter');
        IsolatedFailureReporter.setLogPath(logPath);
    } catch (error) {
        // Non-critical failure if handled by subsequent boot stages
        // Consider adding error logging here if a fallback mechanism exists
    }
};

export const CriticalPaths = defineCriticalPaths();

// Initialize critical components during bootstrap
initializeFailureReporterOnBootstrap(CriticalPaths);
