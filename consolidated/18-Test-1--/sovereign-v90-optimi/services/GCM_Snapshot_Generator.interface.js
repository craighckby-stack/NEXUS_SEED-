/**
 * @class GCM_SnapshotGeneratorInterfaceKernel
 * Defines the required methods for creating, validating, and committing configuration snapshots.
 * This class serves as an abstract interface and must be extended.
 */
class GCM_SnapshotGeneratorInterfaceKernel {
    
    // Rigorously privatized state and configuration
    #config;

    /**
     * @param {Object} [config={}] - Optional configuration parameters.
     */
    constructor(config = {}) {
        this.#ensureAbstractClassAndThrow();
        this.#setupDependencies(config);
    }

    /**
     * [STRATEGIC GOAL] Synchronous Setup Extraction.
     * Extracts synchronous dependency validation and assignment.
     * @param {Object} config
     */
    #setupDependencies(config) {
        // Abstract classes primarily enforce structure, minimal internal state setup.
        this.#config = config;
    }

    /**
     * Creates a deterministic hash of the current configuration set. 
     * Implementation MUST utilize the CanonicalConfigurationHasher plugin to ensure stability.
     * @param {Object} configPayload - The structured configuration data.
     * @returns {string} SHA-512 Hash.
     */
    generateHash(configPayload) {
        this.#throwNotImplementedError('generateHash');
    }

    /**
     * Executes L3 integrity validation prior to transition commitment.
     * @param {string} proposedConfigHash - The hash to validate.
     * @returns {number} Integrity score (0.0 - 1.0).
     */
    runPreTransitionValidation(proposedConfigHash) {
        this.#throwNotImplementedError('runPreTransitionValidation');
    }

    /**
     * Commits the new configuration and generates the CTAL entry payload.
     * @param {Object} transitionMetadata - Details like proposal ID and authority.
     * @returns {Object} Ready-to-log CTAL entry (minus entry_signature).
     */
    commitTransition(transitionMetadata) {
        this.#throwNotImplementedError('commitTransition');
    }

    // --- I/O Proxy Functions ---

    /**
     * [STRATEGIC GOAL] I/O Proxy: Ensures the class is not instantiated directly.
     */
    #ensureAbstractClassAndThrow() {
        if (new.target === GCM_SnapshotGeneratorInterfaceKernel) {
            this.#throwSetupError("Cannot instantiate abstract class GCM_SnapshotGeneratorInterfaceKernel directly. Must be extended.");
        }
    }

    /**
     * [STRATEGIC GOAL] I/O Proxy: Throws an error for unimplemented methods.
     * @param {string} methodName
     */
    #throwNotImplementedError(methodName) {
        throw new Error(`Method GCM_SnapshotGeneratorInterfaceKernel.${methodName} must be implemented by concrete subclass.`);
    }

    /**
     * [STRATEGIC GOAL] I/O Proxy: Throws a setup error.
     * @param {string} message
     */
    #throwSetupError(message) {
        throw new Error(`Kernel Setup Error [GCM_SnapshotGeneratorInterfaceKernel]: ${message}`);
    }
}
