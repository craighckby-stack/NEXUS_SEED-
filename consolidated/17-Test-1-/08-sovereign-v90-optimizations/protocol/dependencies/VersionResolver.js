/**
 * Protocol Component Version Resolver (Sovereign AGI v94.1)
 * Manages the canonical list of compatible component versions for the current protocol runtime.
 * This utility is crucial for ensuring that requested CHR dependencies meet the current system's architectural constraints.
 */
class VersionResolver {
    // Internal state and dependencies converted to private fields for encapsulation.
    #baselineVersions;
    #toolRunner;
    // Stores the selected strategy (SemVer tool or strict equality fallback).
    #runSemVerCheck;

    /**
     * @param {Object} protocolConfig - The global configuration defining baseline system dependencies.
     * @param {Object} [toolRunner] - Mechanism to execute AGI kernel tools/plugins.
     */
    constructor(protocolConfig, toolRunner) {
        this.#setupDependencies(protocolConfig, toolRunner);
    }

    /**
     * Extracts synchronous dependency resolution, configuration loading, and 
     * execution strategy assignment.
     * Satisfies the synchronous setup extraction goal.
     */
    #setupDependencies(protocolConfig, toolRunner) {
        // Expected format: { component_name: { current_version: 'x.y.z', allowed_range: '^x.0.0' }, ... }
        this.#baselineVersions = protocolConfig?.system_dependencies || {};

        if (typeof toolRunner === 'object' && typeof toolRunner.executeTool === 'function') {
            this.#toolRunner = toolRunner;
            
            // Primary execution method using the external SemVerCompatibilityChecker tool.
            this.#runSemVerCheck = (currentVersion, requestedRange) => {
                // Delegation to the proxy function for external I/O
                return this.#delegateToSemVerCheck(currentVersion, requestedRange);
            };
        } else {
            this.#logWarning("ToolRunner unavailable. VersionResolver defaulting to exact version comparison.");
            
            // Fallback: only allow exact matches if the robust tool cannot run.
            this.#runSemVerCheck = (currentVersion, requestedRange) => {
                // Fallback logic
                return currentVersion === requestedRange; 
            };
        }
    }

    /**
     * Proxy for logging warnings.
     * Satisfies the I/O proxy creation goal.
     */
    #logWarning(message) {
        console.warn(message);
    }
    
    /**
     * Proxy for logging errors during external tool execution.
     * Satisfies the I/O proxy creation goal.
     */
    #logError(message, error) {
        console.error(message, error);
    }
    
    /**
     * Proxy to execute the external SemVerCompatibilityChecker tool.
     * Handles tool execution and wraps potential errors.
     * Satisfies the I/O proxy creation goal.
     */
    #delegateToSemVerCheck(currentVersion, requestedRange) {
        try {
            // Assumption: #toolRunner is guaranteed to be set if this function pointer was assigned in #setupDependencies
            return this.#toolRunner.executeTool('SemVerCompatibilityChecker', {
                targetVersion: currentVersion,
                requestedRange: requestedRange
            });
        } catch (e) {
            const message = `Error executing SemVerCompatibilityChecker for version ${currentVersion} against range ${requestedRange}. Defaulting to incompatibility.`;
            this.#logError(message, e);
            // Fail safe on execution error
            return false;
        }
    }

    /**
     * Checks if a requested component version lock is compatible with the current runtime protocol's baseline.
     * 
     * @param {string} componentName 
     * @param {string} requestedVersionLock Semantic version string or range (e.g., "^1.2.0").
     * @returns {boolean}
     */
    isCompatible(componentName, requestedVersionLock) {
        const baseline = this.#baselineVersions[componentName];
        
        if (!baseline) {
            // If the protocol doesn't mandate a version, we assume the component is external or optional.
            return true; 
        }

        const currentVersion = baseline.current_version;

        // Use the standardized internal runner defined during construction
        return this.#runSemVerCheck(currentVersion, requestedVersionLock);
    }

    /**
     * Fetches the official protocol-mandated version for a component.
     * @param {string} componentName
     * @returns {string | null} The mandated version or null if undefined.
     */
    getMandatedVersion(componentName) {
        const baseline = this.#baselineVersions[componentName];
        return baseline ? baseline.current_version : null;
    }
}

module.exports = VersionResolver;