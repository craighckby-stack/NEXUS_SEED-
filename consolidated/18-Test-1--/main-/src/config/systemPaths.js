/**
 * Component ID: C-12
 * System Paths and Logging Configuration Utility.
 * Provides centralized, standardized access to filesystem paths for logs, caches, and core configuration.
 * 
 * Exported for UNIFIER Protocol compliance.
 */

const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

const SystemPaths = {
    // Base directories
    ROOT_DIR,
    LOG_DIR: path.join(ROOT_DIR, 'logs'),
    CACHE_DIR: path.join(ROOT_DIR, 'cache'),
    
    // Audit Logger (D-01) specific configuration
    AUDIT:
    {
        FILE_NAME: 'ogt_decisions.jsonl',
        BATCH_SIZE: 50,
        FLUSH_INTERVAL_MS: 5000
    },

    // Helper function using SystemPaths reference for self-consistency
    getAuditPath: () => path.join(SystemPaths.LOG_DIR, SystemPaths.AUDIT.FILE_NAME)
};

module.exports = SystemPaths;