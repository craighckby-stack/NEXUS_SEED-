const fs = require('fs');
const path = require('path');

const CONSTRAINTS_PATH = path.join(__dirname, '..', 'config', 'pim_constraints.json');
let constraintsCache = null;

/**
 * Loads the PIM constraints configuration file.
 * @returns {object} The constraints object.
 */
function loadConstraints() {
    if (constraintsCache) {
        return constraintsCache;
    }
    
    try {
        // Note: Using synchronous read for initial system configuration load is acceptable.
        const data = fs.readFileSync(CONSTRAINTS_PATH, 'utf8');
        constraintsCache = JSON.parse(data);
        // console.log("PIM Constraints loaded successfully."); // Suppressing console output for cleaner execution
        return constraintsCache;
    } catch (error) {
        console.error(`FATAL: Failed to load PIM constraints from ${CONSTRAINTS_PATH}:`, error.message);
        throw new Error("Constraint loading failed. System cannot proceed without core governance definitions.");
    }
}

/**
 * Retrieves a specific entity definition (e.g., 'Product').
 * @param {string} entityName
 * @returns {object|null}
 */
function getEntityDefinition(entityName) {
    const constraints = loadConstraints();
    return constraints.entities[entityName] || null;
}

/**
 * Retrieves a specific policy definition.
 * @param {string} policyName
 * @returns {object|null}
 */
function getPolicyDefinition(policyName) {
    const constraints = loadConstraints();
    return constraints.policies[policyName] || null;
}

// Export for UNIFIER.js compatibility
module.exports = {
    loadConstraints,
    getEntityDefinition,
    getPolicyDefinition,
    // Expose the raw data for validation services
    get rawConstraints() {
        return loadConstraints();
    }
};