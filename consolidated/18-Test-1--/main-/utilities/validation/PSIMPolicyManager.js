import fs from 'fs';
import path from 'path';
// Assume an abstract validation engine exists for compiling schemas
// import { ValidationEngine } from './ValidationEngine'; 

const psimConfigPath = path.resolve(__dirname, '../../components/validation/PSIM.json');

class PSIMPolicyManager {
    constructor() {
        if (!PSIMPolicyManager.instance) {
            // this.engine = new ValidationEngine(); // Dependency Injection or Abstraction assumed
            this.policyCache = {};
            this.version = null;
            this.loadPolicies();
            PSIMPolicyManager.instance = this;
        }
        return PSIMPolicyManager.instance;
    }

    loadPolicies() {
        let psimConfig;
        try {
            // In a production system, this load would be async or integrated into the config service.
            psimConfig = JSON.parse(fs.readFileSync(psimConfigPath, 'utf8'));
        } catch (e) {
            throw new Error(`[PSIM Policy Load Error] Cannot load configuration: ${e.message}`);
        }

        this.version = psimConfig.version;
        if (psimConfig.status !== 'ACTIVE') {
            console.warn(`[PSIM Policy] System policies (v${this.version}) are marked as INACTIVE.`);
            return;
        }

        console.log(`[PSIM Policy] Compiling v${this.version} schemas...`);
        
        psimConfig.schemas.forEach(policyDef => {
            try {
                // Simulation: In reality, engine.compile uses psimConfig.definitions
                // const compiledValidator = this.engine.compile(policyDef.schema, psimConfig.definitions);
                
                // Using a placeholder stub for demonstration
                const compiledValidator = (data) => { 
                    // Stub validation based on policy_level
                    if (policyDef.policy_level.enum.includes("ENFORCED")) {
                        // Detailed Ajv compilation and validation would occur here
                        // throw new Error("Validation stub failure");
                    }
                    return true; 
                };

                this.policyCache[policyDef.name] = compiledValidator;
                this.policyCache[policyDef.endpoint] = compiledValidator;

            } catch (error) {
                console.error(`[PSIM Policy Load] Failed to compile schema ${policyDef.name}:`, error);
            }
        });
        console.log(`[PSIM Policy] Loaded ${psimConfig.schemas.length} validation policies.`);
    }

    /**
     * Validates data against a named policy or endpoint.
     * @param {string} identifier - Policy Name or Endpoint Path
     * @param {object} data - The payload to validate
     * @returns {boolean}
     */
    validate(identifier, data) {
        const validator = this.policyCache[identifier];
        if (!validator) {
            console.error(`PSIM Policy/Endpoint '${identifier}' not found in cache.`);
            // Fail Safe: If policy is missing, data should often be rejected.
            return false; 
        }
        
        return validator(data);
    }

    getVersion() {
        return this.version;
    }
}

// Ensure Singleton access
export default Object.freeze(new PSIMPolicyManager());
