const fs = require('fs');
const path = require('path');

// Define the expected constraints structure (mirroring ArtifactDependencyAuditor)
const GOVERNANCE_CONFIG_SCHEMA = {
    "cpu_max_msec": 'number',
    "memory_peak_mb": 'number',
    "io_latency_max_ms": 'number',
    "max_dependency_depth": 'number'
};

// Assuming configuration file is now JSON for native Node.js compatibility
const DEFAULT_POLICY_PATH = path.join(process.cwd(), 'config/governance/constraints_v94.json');

class ConfigurationGateway {
    /**
     * Centralized component for dynamically loading and validating governance policies
     * and resource constraints.
     */
    constructor(policyPath = DEFAULT_POLICY_PATH) {
        this.policyPath = policyPath;
        this.config = null;
    }

    _getHardcodedDefaults() {
        /** Provides emergency default constraints if external loading fails. */
        return {
            "cpu_max_msec": 5000,
            "memory_peak_mb": 1024,
            "io_latency_max_ms": 50,
            "max_dependency_depth": 3
        };
    }

    _validateConfigSchema(constraints) {
        /** Ensures the loaded constraints adhere to the mandatory V94 schema. */
        if (typeof constraints !== 'object' || constraints === null) {
            throw new TypeError("Constraints must be an object.");
        }

        for (const key in GOVERNANCE_CONFIG_SCHEMA) {
            if (!constraints.hasOwnProperty(key)) {
                throw new Error(`Missing mandatory governance constraint: ${key}`);
            }
            const expectedType = GOVERNANCE_CONFIG_SCHEMA[key];
            const actualType = typeof constraints[key];

            if (actualType !== expectedType) {
                throw new TypeError(`Constraint ${key} must be type ${expectedType}, found ${actualType}`);
            }
        }
    }

    loadPolicies() {
        /** Loads and caches the configuration policies. */
        if (this.config) {
            return this.config;
        }

        try {
            if (!fs.existsSync(this.policyPath)) {
                 throw new Error(`Policy file not found at ${this.policyPath}`);
            }

            const rawContent = fs.readFileSync(this.policyPath, 'utf8');
            const rawConfig = JSON.parse(rawContent);
            
            const constraints = rawConfig.resource_constraints || {};
            this._validateConfigSchema(constraints);
            
            this.config = rawConfig;
            return this.config;

        } catch (e) {
            console.error(`CRITICAL CONFIG ERROR: Failed to load governance policies from ${this.policyPath}: ${e.message}`);
            // Return safe defaults if policy loading fails, to allow system bootstrap
            this.config = { resource_constraints: this._getHardcodedDefaults() };
            return this.config;
        }
    }

    getResourceConstraints() {
        /** Extracts validated resource constraints. */
        if (this.config === null) {
            this.loadPolicies();
        }
        
        return this.config.resource_constraints || this._getHardcodedDefaults();
    }
}

// Export a singleton instance for UNIFIER compatibility
const gatewayInstance = new ConfigurationGateway();

module.exports = gatewayInstance;