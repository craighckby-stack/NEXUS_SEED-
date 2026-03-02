// src/governance/configIntegrityMonitor.js

const sha512 = require('../utils/cryptoUtils');
const CIMIntegrityError = require('../system/CIMIntegrityError');
const { CIM_CODES, CRITICAL_TARGETS } = require('./CIMGovernanceCodes');

/**
 * Component: CIM (Configuration Integrity Monitor) v94.1
 * Role: Policy Protection Layer / Critical Integrity Checkpoint
 * Mandate: Ensures the immutability and integrity of critical governance configuration files 
 *          against unauthorized mutation or tampering using cryptographically strong checksums (SHA-512) 
 *          verified against the Secure Policy Ledger (D-01).
 */
class ConfigIntegrityMonitor {
    
    /**
     * CRITICAL_TARGETS are now sourced from CIMGovernanceCodes for separation of concerns.
     */

    /**
     * @param {object} dependencies 
     * @param {object} dependencies.auditLogger - D-01 Interface for logging.
     * @param {object} dependencies.proposalManager - A-01 Interface for staging approval checks.
     * @param {object} dependencies.policyLedgerInterface - Dedicated D-01 I/O interface (Must implement getPolicyHashes, storeNewIntegrityHash).
     * @param {string[]} [configPaths] - Optional list of paths to monitor. Defaults to CRITICAL_TARGETS.
     */
    constructor({ auditLogger, proposalManager, policyLedgerInterface }, configPaths = CRITICAL_TARGETS) {
        if (!auditLogger || !proposalManager || !policyLedgerInterface) {
            throw new Error(`CIM Initialization Failure (${CIM_CODES.INIT_FAILURE}): Essential interfaces required.`);
        }
        
        this.auditLogger = auditLogger; 
        this.proposalManager = proposalManager; 
        this.policyLedgerInterface = policyLedgerInterface; 
        
        // Ensure configuration set is frozen and defensive copy is used.
        this.configPaths = Object.freeze([...new Set(configPaths)]); 
        
        this._currentHashes = {}; // Renamed for clarity of internal state
        this.isReady = false;
        
        // Runtime validation check for critical D-01 methods
        if (typeof this.policyLedgerInterface.getPolicyHashes !== 'function') {
             throw new TypeError(`PolicyLedgerInterface missing required method: getPolicyHashes. Code: ${CIM_CODES.LEDGER_INTERFACE_MISSING}`);
        }
    }

    /**
     * Initializes the CIM state by loading the securely signed integrity digests from the D-01 ledger.
     * This operation is blocking and fails the host process if critical integrity state cannot be established.
     * @async
     */
    async initialize() {
        if (this.isReady) return; // Idempotency check

        const context = { targets: this.configPaths.length };
        this.auditLogger.logSystemEvent("CIM_INIT_START", "Attempting secure checksum load from D-01.", context);
        
        try {
            // Securely fetch hashes
            const fetchedHashes = await this.policyLedgerInterface.getPolicyHashes(this.configPaths);

            // Critical validation: Ensure all defined paths were retrieved and are valid strings.
            for (const path of this.configPaths) {
                const hash = fetchedHashes[path];
                if (!hash || typeof hash !== 'string' || hash.length < 64) {
                    // Fail fast if D-01 is missing integrity data for a mandatory target.
                    throw new Error(`Mandatory integrity hash missing or invalid from D-01 for path: ${path}. Hash length failure.`);
                }
            }

            this._currentHashes = fetchedHashes;
            this.isReady = true;
            this.auditLogger.logSystemEvent("CIM_INIT_SUCCESS", `CIM operational, monitoring ${this.configPaths.length} targets.`);
        } catch (error) {
             const failureContext = { paths: this.configPaths, detail: error.message };
             this.auditLogger.logCritical(CIM_CODES.INIT_VETO, "Failed to establish CIM operational state. Potential security vulnerability or Ledger failure.", failureContext);
             // Re-throw to halt system startup with standardized failure code.
             throw new Error(`CIM initialization fatal error (${CIM_CODES.INIT_FATAL}): ${error.message}`);
        }
    }

    /**
     * Executes the integrity check against a provided content string/buffer.
     * This is the highest severity check in the governance chain.
     * @param {string} filePath - The monitored path.
     * @param {string|Buffer} currentContent - The raw content string (or Buffer) of the file.
     * @returns {boolean} True if integrity is verified.
     * @throws {CIMIntegrityError} If a hash mismatch or untracked path is detected.
     */
    checkIntegrity(filePath, currentContent) {
        if (!this.isReady) {
            throw new Error(`CIM State Error: Must be initialized before use. Code: ${CIM_CODES.UNINITIALIZED_ACCESS}`);
        }

        const knownHash = this._currentHashes[filePath];
        
        if (!knownHash) {
            // D941C: Untracked path veto. Policy violation.
            const msg = `Configuration path '${filePath}' is untracked by Policy Ledger. Integrity Veto Issued.`;
            this.auditLogger.logCritical(CIM_CODES.UNTRACKED_VETO, msg, { file: filePath });
            // CIMIntegrityError handles the classification
            throw new CIMIntegrityError(msg, filePath, 'UNTRACKED_CONFIG'); 
        }

        const computedHash = sha512(currentContent);
        
        if (knownHash !== computedHash) {
            // D941D: Hash mismatch veto. Security failure (Unauthorized mutation).
            const msg = `Integrity failure detected on '${filePath}'. Hash mismatch. Mutation suspected.`;
            // Log only a truncated version of the actual hash for security/brevity
            const logContext = { 
                file: filePath, 
                expected: knownHash.substring(0, 16) + '...', 
                actual: computedHash.substring(0, 16) + '...' 
            };
            this.auditLogger.logCritical(CIM_CODES.MUTATION_VETO, msg, logContext);
            throw new CIMIntegrityError(msg, filePath, 'HASH_MISMATCH');
        }
        
        this.auditLogger.logSystemEvent("CIM_VERIFIED", `Integrity of ${filePath} verified successfully.`, { file: filePath });
        return true;
    }

    /**
     * Updates the secure integrity record post-P-01 approval (A-01 staging).
     * This is a sensitive operation protected by the A-01 proposal digest.
     * @async
     * @param {string} filePath - Path of the file updated.
     * @returns {Promise<void>} 
     * @throws {Error} If A-01 digest is missing or D-01 write fails.
     */
    async updateIntegrityRecord(filePath) {
        if (!this.isReady) {
             throw new Error("CIM State Error: Cannot update record until initialized.");
        }
        
        const approvedStateDigest = this.proposalManager.retrieveApprovedHash(filePath);

        if (!approvedStateDigest || typeof approvedStateDigest !== 'string' || approvedStateDigest.length < 64) {
            const context = { file: filePath, digestLength: (approvedStateDigest ? approvedStateDigest.length : 0) };
            this.auditLogger.logCritical(CIM_CODES.UPDATE_VETO, `Integrity update rejected. Missing valid approved A-01 state digest.`, context);
            throw new Error("Integrity record update vetoed. Missing valid A-01 approval stage data.");
        }

        const oldHash = this._currentHashes[filePath] || 'N/A';
        
        // Stage tentative local update
        this._currentHashes[filePath] = approvedStateDigest;
        
        try {
            // Durable commit to secure ledger (D-01)
            await this.policyLedgerInterface.storeNewIntegrityHash(filePath, approvedStateDigest); 
            
            this.auditLogger.logSystemEvent("CIM_RECORD_COMMITTED", `Integrity digest for ${filePath} securely updated in D-01.`, {
                file: filePath,
                oldHash: oldHash.substring(0, 16) + '...', 
                newHash: approvedStateDigest.substring(0, 16) + '...'
            });

        } catch (error) {
            // CRITICAL RECOVERY: If D-01 commit fails, revert the in-memory state to preserve security consistency (using the old, verified hash).
            this._currentHashes[filePath] = oldHash;
            this.auditLogger.logCritical(CIM_CODES.D01_COMMIT_FAILURE, `Failed to commit new hash for ${filePath}. Local state reverted. CIM state unstable.`, { file: filePath, error: error.message });
            throw error; // Propagate failure to halt the deployment process.
        }
    }
}

module.exports = ConfigIntegrityMonitor;