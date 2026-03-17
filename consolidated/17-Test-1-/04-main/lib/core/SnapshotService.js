/**
 * @interface IImmutableReferenceResolver
 * Defines the required interface for the kernel utility responsible for
 * Content-Addressable Storage (CAS) operations specific to state snapshots.
 */
interface IImmutableReferenceResolver {
    getSnapshot(refKey: string): Promise<any>;
    createSnapshot(label: string, stateData: any): Promise<string>;
}

// Purpose: Handles the persistence, indexing, and retrieval of immutable state snapshots (S01, S02, etc.) for code, metrics, and resources.
// These snapshots serve as the baselines referenced by mandate constraints.

// We declare the dependency which is assumed to be provided by the AGI kernel environment.
declare const ImmutableReferenceResolver: IImmutableReferenceResolver;

class SnapshotService {
    #resolver: IImmutableReferenceResolver;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Extracts synchronous dependency resolution and initialization logic.
     */
    #setupDependencies(): void {
        // Dependency injection check. We ensure the required kernel utility is available.
        if (typeof ImmutableReferenceResolver === 'undefined') {
            this.#throwSetupError("Required utility ImmutableReferenceResolver is missing.");
        }
        this.#resolver = ImmutableReferenceResolver;
    }

    /**
     * Throws an error during initialization and handles associated logging.
     */
    #throwSetupError(message: string): never {
        console.error(`SnapshotService initialization error: ${message}`);
        throw new Error(message);
    }

    /**
     * Retrieves a complete system state snapshot based on a reference key.
     * @param {string} refKey - The context key (e.g., 'S02_BASELINE').
     * @returns {Promise<Object>} Snapshot data containing metric and artifact states.
     */
    async getSnapshot(refKey: string): Promise<Object> {
        this.#logRetrievalRequest(refKey);
        try {
            const snapshot = await this.#delegateToGetSnapshot(refKey);
            return snapshot as Object;
        } catch (error) {
            this.#handleGetSnapshotError(refKey, error);
        }
    }

    #logRetrievalRequest(refKey: string): void {
        console.log(`SnapshotService: Retrieving snapshot via resolver for key: ${refKey}`);
    }

    async #delegateToGetSnapshot(refKey: string): Promise<any> {
        // External dependency interaction
        return await this.#resolver.getSnapshot(refKey);
    }

    #handleGetSnapshotError(refKey: string, error: any): never {
        this.#logRetrievalError(refKey, error);
        this.#throwRetrievalError(refKey);
    }

    #logRetrievalError(refKey: string, error: any): void {
        console.error(`Error resolving snapshot ${refKey}:`, error);
    }

    #throwRetrievalError(refKey: string): never {
        const message = `Snapshot reference key ${refKey} could not be resolved.`;
        throw new Error(message);
    }

    /**
     * Stores and indexes a new immutable snapshot of the current operational state.
     * @param {string} label - A human-readable label for the snapshot (e.g., 'PRE_EVOLUTION').
     * @param {Object} stateData - The data capturing the current state.
     * @returns {Promise<string>} The generated, unique reference key for the new snapshot.
     */
    async createSnapshot(label: string, stateData: Object): Promise<string> {
        // Delegation: The underlying resolver handles the cryptographic hashing, storage, and key indexing.
        this.#logCreationRequest(label);
        return await this.#delegateToCreateSnapshot(label, stateData);
    }

    #logCreationRequest(label: string): void {
        console.log(`SnapshotService: Requesting snapshot creation for label: ${label}`);
    }

    async #delegateToCreateSnapshot(label: string, stateData: Object): Promise<string> {
        // External dependency interaction
        return await this.#resolver.createSnapshot(label, stateData);
    }
}

export const snapshotService = new SnapshotService();