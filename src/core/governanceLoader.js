/**
 * GovernanceLoader: Critical Configuration Handler for Sovereign AGI
 * Role: Loads, validates, and distributes immutable, externally mandated governance configuration (OGT thresholds).
 * Note: Uses synchronous file reading during startup initialization. Failure results in process halt.
 */

import fs from 'fs';
import yaml from 'js-yaml';
import Joi from 'joi';
import logger from '../utils/logger';
// Ideally, import ConfigService for path resolution in the future

const GOVERNANCE_CONFIG_PATH = 'config/governance.yaml';

// Define the required immutable schema for external governance controls
// Immutability is critical for compliance and deterministic operation.
const GovernanceSchema = Joi.object({
    required_confidence_default: Joi.number().min(0).max(1).strict().required(),
    risk_model_weights: Joi.object().pattern(Joi.string().strict(), Joi.number().strict()).required(),
    atm_decay_rate: Joi.number().min(0).max(1).strict().required(),
    // Allows governance file to temporarily override strictness if migration requires it
    strict_validation: Joi.boolean().default(true),
}).unknown(false); // Disallow unknown properties by default (high compliance standard)

class GovernanceLoader {
    constructor() {
        this._config = null; // Use internal naming convention
    }

    /**
     * Initializes the governance config. This must be called successfully before operations begin.
     * @returns {Object} The immutable governance configuration object.
     */
    initialize() {
        if (this._config) {
            logger.warn('Governance configuration already initialized. Skipping reload.');
            return this._config;
        }

        try {
            const fileContents = fs.readFileSync(GOVERNANCE_CONFIG_PATH, 'utf8');
            const rawConfig = yaml.load(fileContents);
            
            // Apply strict validation based on defined schema and config file preference
            const validationOptions = {
                abortEarly: false,
                // Only allow unknown keys if 'strict_validation: false' is present in the governance file
                allowUnknown: rawConfig.strict_validation === false
            };

            const { error, value } = GovernanceSchema.validate(rawConfig, validationOptions);

            if (error) {
                logger.error('Governance Configuration Validation Failed:', error.details);
                throw new Error(`Invalid governance schema defined in ${GOVERNANCE_CONFIG_PATH}: ${error.message}`);
            }
            
            // Enforce immutability upon successful loading to ensure governance contract stability
            this._config = Object.freeze(value); 
            logger.info('Governance configuration loaded and verified (Immutable).');
            return this._config;

        } catch (e) {
            // Mandatory halt if governance thresholds cannot be established (Compliance requirement)
            logger.fatal(`FATAL ERROR: Could not establish OGT governance contract: ${e.message}`);
            process.exit(1);
        }
    }

    /**
     * Retrieves the entire immutable configuration object.
     * Use accessor methods instead of accessing keys directly where possible.
     * @returns {Object} The immutable governance configuration.
     */
    get config() {
        if (!this._config) {
             throw new Error('Governance configuration not initialized. Call initialize() first.');
        }
        return this._config; 
    }

    /**
     * Accessor for critical AI risk thresholds (e.g., used by C-11 MCRA module)
     */
    getRiskThresholds() {
        return {
            confidenceDefault: this.config.required_confidence_default,
            riskWeights: this.config.risk_model_weights
        };
    }
    
    /**
     * Accessor for Autonomous Timeline Management (ATM) settings
     */
    getAtmSettings() {
        return {
            decayRate: this.config.atm_decay_rate,
        };
    }
}

export default new GovernanceLoader();
