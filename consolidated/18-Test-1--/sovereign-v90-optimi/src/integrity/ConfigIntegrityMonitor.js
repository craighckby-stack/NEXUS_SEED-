const crypto = require('crypto');

/**
 * Utility function to calculate SHA-256 hash and compare. 
 * Used as the default implementation if no hasher utility is injected.
 * 
 * @param {string} content - The content string to hash.
 * @param {string} [expectedHash] - The expected hash string for comparison.
 * @returns {{hash: string, match: boolean|undefined, expected: string|undefined}}
 */
function defaultHasher(content, expectedHash) {
    if (typeof content !== 'string') {
        throw new Error('Content must be a string.');
    }
    // Ensure crypto is available if we use the default path
    if (!crypto || typeof crypto.createHash !== 'function') {
        throw new Error("Cryptography operations failed: Node's 'crypto' module not functional.");
    }
    
    const currentHash = crypto.createHash('sha256').update(content).digest('hex');
    
    const result = {
        hash: currentHash,
        match: expectedHash ? (currentHash === expectedHash) : undefined,
        expected: expectedHash
    };
    return result;
}


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
 * NOTE: This component now relies on an injected or default hasher utility for cryptographic operations.
 */
class ConfigIntegrityMonitor {
    
    /**
     * @param {object} hashStore - Persistence layer for expected hashes/signatures.
     * @param {object} auditLogger - D-01 Audit interface.
     * @param {object} [hasherUtility] - An object implementing a `execute({content, expectedHash})` method for hashing.
     */
    constructor(hashStore, auditLogger, hasherUtility = { execute: (args) => defaultHasher(args.content, args.expectedHash) }) {
        if (!hashStore || !auditLogger) {
            throw new Error("CIM requires HashStore and AuditLogger.");
        }
        this.hashStore = hashStore;
        this.auditLogger = auditLogger;
        // Inject the cryptographic utility
        this.hasher = hasherUtility;
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
        const expectedHash = this.hashStore.getExpectedHash(filePath);
        
        if (!expectedHash) {
            this.auditLogger.logWarning("INTEGRITY_SKIP", `No expected hash found for ${filePath}. Skipping verification.`);
            return true;
        }

        // 2. Calculate current content hash and compare using the injected hasher utility.
        const { hash: currentHash, match } = this.hasher.execute({ content, expectedHash });

        if (match === false) {
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