import path from 'path';

/**
 * System-wide Configuration Path Constants.
 * Centralizes paths to critical configuration files.
 */

// We assume execution context starts from the project root for critical startup config resolution.
const APP_ROOT = process.cwd(); 

const ConfigPaths = {
    // Critical Governance Thresholds (Essential for Sovereign AGI startup)
    GOVERNANCE_CONFIG: path.resolve(APP_ROOT, 'config/governance.yaml'),
    
    // Standard Logger Output Location
    LOG_DIR: path.resolve(APP_ROOT, 'logs'),
    
    // Add other critical paths here as needed (e.g., memory, temporary artifacts)
    ARTIFACT_TEMP_DIR: path.resolve(APP_ROOT, 'tmp/artifacts'),
};

export default ConfigPaths;
