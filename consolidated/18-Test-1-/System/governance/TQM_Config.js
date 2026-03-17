/**
 * TQM Configuration Loader (Total Quality Management)
 * Provides access and validation for system quality thresholds.
 * Integrated under the UNIFIER Protocol.
 */
const TQM_THRESHOLDS = require('./TQM_Thresholds.json');

/**
 * Governance module for accessing and validating TQM configuration.
 */
const TQMConfig = {
    /**
     * Retrieves the full TQM configuration object.
     * @returns {object}
     */
    getThresholds: () => TQM_THRESHOLDS,

    /**
     * Performs a structural validation of the loaded configuration against governance axioms.
     * @returns {boolean}
     * @throws {Error} if core configuration is missing.
     */
    validateConfig: () => {
        if (!TQM_THRESHOLDS || !TQM_THRESHOLDS.TQM_Core_Config) {
            throw new Error("TQM Configuration is invalid or missing core structure required by Governance Axioms.");
        }
        return true;
    }
};

module.exports = TQMConfig;
