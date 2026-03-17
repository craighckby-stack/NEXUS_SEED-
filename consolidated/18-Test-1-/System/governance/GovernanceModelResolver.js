const path = require('path');
const logger = console; // Placeholder for actual unified logger service

/**
 * Utility class responsible for abstracting the location and loading of Governance Models.
 * Decouples the system from hardcoded file path dependencies in the JavaScript execution environment.
 */
class GovernanceModelResolver {

    /**
     * Dynamically loads the specified Model class or object from the module path.
     * This mimics Python's dynamic module/class resolution using Node's require mechanism.
     * 
     * @param {string} modelName - The name of the exported class/object.
     * @param {string} importPath - The relative path to the module file (e.g., './policies/StandardLaw').
     * @param {string} [packageRoot='governance'] - The root directory to start resolution from, typically the root of governance components.
     * @returns {Object} The resolved Model class or configuration object.
     * @throws {Error} If the model cannot be loaded or is invalid.
     */
    static resolvePolicyModel(modelName, importPath, packageRoot = 'governance') {
        
        // Resolve path relative to the current working directory, ensuring it targets the correct root.
        const fullPath = path.resolve(packageRoot, importPath);

        try {
            // Attempt to require the module dynamically
            const module = require(fullPath); 
            
            // Check for specific named export (mimicking Python's getattr)
            let Model = module[modelName];
            
            if (!Model) {
                 // Fallback: Check for default export if modelName implies a primary module export
                 Model = module.default;
            }

            if (!Model) {
                throw new TypeError(`Export '${modelName}' not found in module ${fullPath}.`);
            }

            // Minimal validation: Ensure it's a structural object or function/class
            if (typeof Model !== 'function' && (typeof Model !== 'object' || Model === null)) {
                 throw new TypeError(`Resolved object '${modelName}' is not a valid Model structure (expected function/object).`);
            }
            
            logger.debug(`Successfully resolved model: ${modelName} from ${fullPath}`);
            return Model;
            
        } catch (e) {
            logger.error(`RESOLUTION FAILURE: Could not load required governance model '${modelName}'. Error: ${e.message}`);
            const resolutionError = new Error(`Failed to locate governance model ${modelName} required from path ${fullPath}. Cause: ${e.message}`);
            resolutionError.name = "GovernanceResolutionError";
            throw resolutionError;
        }
    }
}

module.exports = { GovernanceModelResolver }; // Essential export for UNIFIER.js integration