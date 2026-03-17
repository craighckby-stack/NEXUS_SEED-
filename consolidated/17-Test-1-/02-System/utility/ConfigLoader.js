const fs = require('fs');
const path = require('path');

/**
 * Loads and parses a JSON configuration file from the system's config directory.
 * @param {string} relativePath - The path relative to the root config directory (e.g., 'RIMP/EnforcementPolicies.json').
 * @returns {object} The parsed configuration object.
 */
function loadPolicyConfig(relativePath) {
    // Resolve path relative to the project root where 'config' resides.
    const configRoot = path.join(process.cwd(), 'config');
    const fullPath = path.join(configRoot, relativePath);

    try {
        const data = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[ConfigLoader] Failed to load configuration file: ${fullPath}`, error.message);
        throw new Error(`Configuration loading failed for ${relativePath}`);
    }
}

module.exports = {
    loadPolicyConfig
};