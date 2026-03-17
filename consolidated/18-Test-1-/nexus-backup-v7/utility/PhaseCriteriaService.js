const fs = require('fs');
const path = require('path');

/**
 * Service responsible for loading and providing the system phase transition criteria.
 * This decouples the criteria definition from the execution kernel.
 */
class PhaseCriteriaService {
    constructor() {
        this.criteria = this._loadCriteria();
    }

    _loadCriteria() {
        // Path resolution relative to the UNIFIER structure
        const configPath = path.join(__dirname, '..', 'config', 'phase_manager_criteria.json');
        try {
            const data = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(data).phases;
        } catch (error) {
            console.error(`[PhaseCriteriaService] Failed to load criteria: ${error.message}`);
            // Return a safe default structure if loading fails
            return []; 
        }
    }

    /**
     * Retrieves the phase transition criteria.
     * @returns {Array} List of phase definitions.
     */
    getCriteria() {
        return this.criteria;
    }
}

// UNIFIER Protocol Mandate: Export the functional module
module.exports = new PhaseCriteriaService();