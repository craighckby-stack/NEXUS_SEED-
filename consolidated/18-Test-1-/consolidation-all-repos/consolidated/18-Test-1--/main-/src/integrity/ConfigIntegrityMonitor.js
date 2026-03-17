const crypto = require('crypto');

/**
 * Custom Error for integrity breaches caught by the ConfigIntegrityMonitor.
 */
class CIMIntegrityError extends Error {
    constructor(message, filePath, violationDetails = {}) {
        super(message);
        this.name = 'CIMIntegrityError';
        this.filePath = filePath;
        this.violationDetails = violationDetails;
    }
}

/**
 * Component: ConfigIntegrityMonitor (CIM)
 * Role: Enforcement Layer for Configuration Trustworthiness
 * Mandate: Monitors critical configuration content (usually via cryptographic hashes or signatures)
 *          and throws a CIMIntegrityError immediately upon detection of tampering or corruption.
 * NOTE: This component is assumed to interact with a secure HashStore to retrieve baseline integrity checks.
 */
class ConfigIntegrityMonitor {
    
    /**
     * @param {object} hashStore - Persistence layer for expected hashes/signatures.
     * @param {object} auditLogger - D-01 Audit interface.
     */
    constructor(hashStore, auditLogger) {
        if (!hashStore || !auditLogger) {
            throw new Error("CIM requires HashStore and AuditLogger.");
        }
        this.hashStore = hashStore;
        this.auditLogger = auditLogger;
    }

    /**
     * Checks if the configuration content matches expected integrity parameters.
     * @param {string} filePath - The path of the file being verified.
     * @param {string} content - The file content.
     * @returns {boolean} True if integrity passes.
     * @throws {CIMIntegrityError} If verification fails.
     */
    checkIntegrity(filePath, content) {
        // 1. Fetch expected hash for filePath from HashStore.
        // Assumes hashStore.getExpectedHash is synchronous or data is pre-loaded.
        const expectedHash = this.hashStore.getExpectedHash(filePath);
        
        if (!expectedHash) {
            this.auditLogger.logWarning("INTEGRITY_SKIP", `No expected hash found for ${filePath}. Skipping verification.`);
            // Depending on policy, this could be a failure, but for now, we pass if verification is impossible.
            return true;
        }

        // 2. Calculate current content hash (using standard SHA-256 for critical configs)
        const currentHash = crypto.createHash('sha256').update(content).digest('hex');

        if (currentHash !== expectedHash) {
            this.auditLogger.logCritical(
                "INTEGRITY_BREACH", 
                `Configuration integrity failed for ${filePath}. Hash mismatch detected.`,
                { expected: expectedHash, actual: currentHash }
            );
            throw new CIMIntegrityError(
                `Configuration integrity breach: Hash mismatch for ${filePath}. Resolution vetoed.`,
                filePath,
                { type: 'HashMismatch', expected: expectedHash, actual: currentHash }
            );
        }

        this.auditLogger.logSystemEvent("INTEGRITY_CHECK_PASS", `${filePath} content trust established.`);
        return true;
    }
}

module.exports = { ConfigIntegrityMonitor, CIMIntegrityError };