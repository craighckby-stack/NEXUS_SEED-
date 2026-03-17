/**
 * ACVD Profile Resolver Utility
 * Reads acvd_profile_map.json and resolves configuration keys (e.g., verificationPipelineKey)
 * into concrete values defined in the 'definitions' section, applying inheritance logic.
 */

const fs = require('fs');
const path = require('path');

function resolveProfile(profileName, mapData) {
    if (!mapData.profiles || !mapData.definitions) {
        throw new Error('Invalid ACVD profile map structure.');
    }

    let profile = mapData.profiles[profileName];
    if (!profile) {
        throw new Error(`Profile ${profileName} not found.`);
    }

    // Handle inheritance
    if (profile.inherits) {
        if (!mapData.profiles[profile.inherits]) {
            throw new Error(`Inherited profile ${profile.inherits} not found.`);
        }
        const baseProfile = resolveProfile(profile.inherits, mapData);
        // Merge base properties, allowing current profile to override
        profile = { ...baseProfile, ...profile };
        delete profile.inherits; // Clean up inheritance marker
    }

    // Resolve definition keys
    const resolvedProfile = { ...profile };
    const definitions = mapData.definitions;

    // Iterate over definition types and resolve associated keys
    const definitionKeys = {
        targetInfrastructureKey: definitions.infrastructureTargets,
        verificationPipelineKey: definitions.verificationPipelines,
        preflightCheckKey: definitions.preflightChecks,
        deploymentStrategyKey: definitions.deploymentStrategies
    };

    for (const [key, mapping] of Object.entries(definitionKeys)) {
        if (resolvedProfile[key]) {
            const definitionValue = mapping[resolvedProfile[key]];
            if (!definitionValue) {
                throw new Error(`Definition key ${resolvedProfile[key]} for ${key} not found.`);
            }
            // Replace the key identifier with the concrete value/array
            resolvedProfile[key.replace('Key', '')] = definitionValue;
            delete resolvedProfile[key];
        }
    }

    return resolvedProfile;
}

// Example usage (assuming map file is loaded externally):
// const mapData = JSON.parse(fs.readFileSync(path.join(__dirname, 'acvd_profile_map.json'), 'utf8'));
// const productionConfig = resolveProfile('production', mapData);

module.exports = { resolveProfile };
