const fs = require('fs/promises');
const path = require('path');
const LogIntegrityService = require('../core/persistence/LogIntegrityService');

// --- Policy Constants (Merged for immediate functionality) ---
const DEFAULT_ACVD_PATH = path.join(process.cwd(), 'governance', 'acvd.json');

const ACVDKeys = {
    VERSION: 'version',
    UTILITY_THRESHOLDS: 'utility_thresholds',
    POLICY_INVARIANTS: 'policy_invariants',
    REQUIRED_KEYS: ['version', 'utility_thresholds', 'policy_invariants']
};
// --------------------------------------------------

// --- Custom Errors ---
class PCSBaseError extends Error {
    constructor(message) {
        super(`[PCS] ${message}`);
        this.name = 'PCSBaseError';
    }
}

class ConfigurationError extends PCSBaseError {
    constructor(message) {
        super(message);
        this.name = 'ConfigurationError';
    }
}

class PolicyIntegrityError extends PCSBaseError {
    constructor(message) {
        super(message);
        this.name = 'PolicyIntegrityError';
    }
}
// --------------------------------------------------

/**
 * Policy and Constraint Server (PCS).
 * Responsible for reading, validating, and serving the definitive
 * Axiomatic Constraint Vetting Document (ACVD).
 */
class PolicyConstraintServer {

    constructor(acvdPath = DEFAULT_ACVD_PATH) {
        this.ACVD_KEYS = ACVDKeys;
        this.acvdPath = acvdPath;
        this.constraints = null;
    }

    async initialize() {
        if (this.constraints) return;
        try {
            this.constraints = await this._loadAndValidateACVD();
            const version = this.constraints[this.ACVD_KEYS.VERSION] || 'N/A';
            LogIntegrityService.info(`ACVD v${version} successfully loaded and validated from ${this.acvdPath}.`);
        } catch (e) {
            LogIntegrityService.critical(`Failed to initialize Policy Constraint Server: ${e.message}`);
            throw e;
        }
    }

    async _loadACVDFile() {
        try {
            const dataBuffer = await fs.readFile(this.acvdPath, 'utf8');
            const data = JSON.parse(dataBuffer);

            if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                throw new Error("ACVD root must be a JSON object.");
            }
            return data;

        } catch (error) {
            if (error.code === 'ENOENT') {
                const msg = `Fatal Error: ACVD file not found at ${this.acvdPath}. Cannot guarantee axiomatic compliance.`;
                LogIntegrityService.critical(msg);
                throw new ConfigurationError(msg);
            }
            if (error instanceof SyntaxError) {
                const msg = `ACVD structural JSON integrity breach. Policy data corrupted: ${error.message}`;
                LogIntegrityService.critical(msg);
                throw new ConfigurationError(msg);
            }
            // Catches the non-object root type check
            if (error instanceof Error) {
                const msg = `ACVD structural root failure: ${error.message}`;
                LogIntegrityService.critical(msg);
                throw new ConfigurationError(msg);
            }
            throw error;
        }
    }

    _validateStructure(data) {
        const missingKeys = this.ACVD_KEYS.REQUIRED_KEYS.filter(key => !(key in data));
        
        if (missingKeys.length > 0) {
            const msg = `ACVD Structure Invalid: Missing essential governance keys: ${missingKeys.join(', ')}. Halting.`;
            LogIntegrityService.critical(msg);
            throw new ConfigurationError(msg);
        }
    }

    async _loadAndValidateACVD() {
        const data = await this._loadACVDFile();
        this._validateStructure(data);
        return data;
    }

    getUtilityThreshold(metricKey) {
        if (!this.constraints) {
            throw new ConfigurationError("Policy Constraint Server not initialized. Must call .initialize() first.");
        }
        
        const thresholds = this.constraints[this.ACVD_KEYS.UTILITY_THRESHOLDS] || {};
        
        if (!(metricKey in thresholds)) {
             LogIntegrityService.warning(`Policy Gap: Threshold for '${metricKey}' not explicitly defined in ACVD.`);
             throw new Error(`[PCS Policy Definition Error] Threshold for ${metricKey} not defined.`);
        }
        
        const value = thresholds[metricKey];
        
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            const msg = `Data Type Integrity Failure: Threshold '${metricKey}'='${value}' is non-numeric, violating policy contract.`;
            LogIntegrityService.error(msg);
            throw new PolicyIntegrityError(msg);
        }
        
        return numericValue;
    }

    getInvariants() {
        if (!this.constraints) {
            throw new ConfigurationError("Policy Constraint Server not initialized. Must call .initialize() first.");
        }
        return this.constraints[this.ACVD_KEYS.POLICY_INVARIANTS];
    }
}

module.exports = {
    PolicyConstraintServer,
    ConfigurationError,
    PolicyIntegrityError,
    PCSBaseError
};