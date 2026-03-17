const fs = require('fs');
const path = require('path');

// Determine the root path dynamically
const ROOT_DIR = path.join(__dirname, '..');
const CONFIG_ROOT = path.join(ROOT_DIR, 'config');

/**
 * Loads and parses a specific configuration matrix file.
 * @param {string} filename - The name of the JSON configuration file.
 */
function loadMatrix(filename) {
    try {
        const filePath = path.join(CONFIG_ROOT, filename);
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Failure to load critical config should usually halt or use strict defaults
        console.error(`[CONFIG_SERVICE] Failed to load required configuration file ${filename}:`, error.message);
        return {}; 
    }
}

// Load the primary Resource Allocation Matrix immediately upon module initialization
const ResourceAllocationMatrix = loadMatrix('ResourceAllocationMatrix.json');

module.exports = {
    ResourceAllocationMatrix,
    loadMatrix,
    // Ensure this configuration service is fully exportable for UNIFIER.js integration
};