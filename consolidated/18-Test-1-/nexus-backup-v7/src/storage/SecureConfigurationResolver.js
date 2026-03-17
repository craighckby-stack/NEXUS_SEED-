const fs = require('fs/promises');

/**
 * Custom Error indicating a critical I/O failure during configuration resolution.
 */
class ResolverIOError extends Error {
    constructor(message, filePath) {
        super(message);
        this.name = 'ResolverIOError';
        this.filePath = filePath;
    }
}

/**
 * Component: SecureConfigurationResolver
 * Role: I/O Gateway for Critical Configurations
 * Mandate: Acts as the exclusive source of truth for critical configurations, 
 *          enforcing immediate integrity verification by the ConfigIntegrityMonitor (CIM) 
 *          before returning the content. Prevents unverified data from entering the runtime.
 */
class SecureConfigurationResolver {
    
    /**
     * @param {object} cim - Instance of ConfigIntegrityMonitor.
     * @param {object} auditLogger - D-01 Audit interface.
     */
    constructor(cim, auditLogger) {
        if (!cim || typeof cim.checkIntegrity !== 'function') {
            throw new TypeError("SecureConfigurationResolver requires a valid CIM instance with checkIntegrity method.");
        }
        if (!auditLogger || typeof auditLogger.logCritical !== 'function') {
             throw new TypeError("SecureConfigurationResolver requires a valid AuditLogger instance.");
        }
        this.cim = cim;
        this.auditLogger = auditLogger;
    }

    /**
     * Reads and verifies the content of a critical configuration file.
     * @param {string} filePath - The path to the configuration file.
     * @returns {Promise<string>} The verified content of the file.
     * @throws {ResolverIOError} If file read fails (Fails fast).
     * @throws {CIMIntegrityError} If integrity check fails (Propagated from CIM).
     */
    async resolve(filePath) {
        if (typeof filePath !== 'string' || filePath.length === 0) {
            throw new TypeError("filePath must be a non-empty string for resolution.");
        }
        
        let content;

        // 1. Read the file content securely (Fails fast on I/O issues).
        try {
            content = await fs.readFile(filePath, { encoding: 'utf8' });
            
        } catch (readError) {
            // Log critical failure and throw specific error type.
            this.auditLogger.logCritical(
                "CONFIG_IO_FAILURE", 
                `Failed to read critical configuration file: ${filePath}.`,
                { contextError: readError.message, code: readError.code }
            );
            throw new ResolverIOError(`Secure configuration I/O failure: ${filePath}`, filePath);
        }

        // 2. Immediately enforce integrity check via CIM.
        try {
            this.cim.checkIntegrity(filePath, content);
            
        } catch (integrityError) {
            // Propagate the integrity error (expected to be CIMIntegrityError)
            this.auditLogger.logSystemEvent("RESOLVER_VETO", `Resolution vetoed by CIM for ${filePath}.`);
            throw integrityError; 
        }

        this.auditLogger.logSystemEvent("RESOLVER_SUCCESS", `Configuration resolved and verified: ${filePath}.`);
        return content;
    }
}

module.exports = { SecureConfigurationResolver, ResolverIOError };