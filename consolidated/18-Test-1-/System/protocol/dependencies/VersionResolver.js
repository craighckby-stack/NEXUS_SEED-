/**
 * Protocol Component Version Resolver (Sovereign AGI v94.1)
 * Manages the canonical list of compatible component versions for the current protocol runtime.
 * This utility is crucial for ensuring that requested CHR dependencies meet the current system's architectural constraints.
 */
class VersionResolver {
    /**
     * @param {Object} protocolConfig - The global configuration defining baseline system dependencies.
     */
    constructor(protocolConfig) {
        // Expected format: { component_name: { current_version: 'x.y.z', allowed_range: '^x.0.0' }, ... }
        this.baselineVersions = protocolConfig.system_dependencies || {};
    }

    /**
     * Checks if a requested component version lock is compatible with the current runtime protocol's baseline.
     * Note: Requires a dedicated semver library (e.g., 'semver') in a real implementation.
     * 
     * @param {string} componentName 
     * @param {string} requestedVersionLock Semantic version string or range (e.g., "^1.2.0").
     * @returns {boolean}
     */
    isCompatible(componentName, requestedVersionLock) {
        const baseline = this.baselineVersions[componentName];
        
        if (!baseline) {
            // If the protocol doesn't mandate a version, we assume the component is external or optional.
            return true; 
        }

        // --- Placeholder for actual semver logic ---
        // In production, this would use a library like `semver.satisfies(baseline.current_version, requestedVersionLock)`
        
        // Example high-level check: disallow versions targeting future protocols.
        if (requestedVersionLock.includes('^95') || requestedVersionLock.includes('^96')) {
            return false; 
        }
        
        return true;
    }

    /**
     * Fetches the official protocol-mandated version for a component.
     * @param {string} componentName
     * @returns {string | null} The mandated version or null if undefined.
     */
    getMandatedVersion(componentName) {
        return this.baselineVersions[componentName] ? this.baselineVersions[componentName].current_version : null;
    }
}

module.exports = VersionResolver;