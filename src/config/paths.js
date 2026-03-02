const path = require('path');

const ARTIFACT_ROOT = path.resolve(process.cwd(), 'artifacts');

/**
 * Defines centralized file paths for critical system operations, ensuring 
 * consistency across utilities like ArtifactArchiver.
 */
module.exports = {
    // Root directory for all governance artifacts
    ARTIFACT_ROOT,

    // Staging area for active/newly created governance artifacts (e.g., A-01 proposals)
    STAGING_PATH: path.join(ARTIFACT_ROOT, 'staging'),
    
    // Quarantine/Archive area for artifacts that failed integrity checks or were executed.
    QUARANTINE_PATH: path.join(ARTIFACT_ROOT, 'quarantine'),
};