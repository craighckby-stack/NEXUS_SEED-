import { CanonicalHashingTool } from '../integrity/canonical_hashing_tool';
import { CanonicalErrorSerializer } from '../errors/canonical_error_serializer';

/**
 * Interface definition for a retrieval service (Lazy Loading)
 * @typedef {Object} ArtifactRetrievalService
 * @property {(id: string) => Promise<any>} retrieve - Function to fetch the artifact data.
 */

/**
 * Interface definition for the Function Memoization Utility (The extracted Plugin: FunctionMemoizer)
 * @typedef {Object} FunctionMemoizer
 * @property {<T extends Function>(func: T, keyGenerator?: (...args: any[]) => string) => T} createMemoizer
 */

type ArtifactData = { data: any, hash: string };
type RetrievalFunction = (id: string) => Promise<ArtifactData>;
type IntegrityCheckFunction = (id: string, expectedHash: string) => Promise<boolean>;

/**
 * PreflightArtifactProcessor implements artifact validation using memoization,
 * lazy loading, and functional composition for high efficiency.
 */
export class PreflightArtifactProcessor {
    private readonly retrievalService: ArtifactRetrievalService;
    private readonly hasher: CanonicalHashingTool;
    private readonly errorSerializer: CanonicalErrorSerializer;
    private readonly memoizationUtility: FunctionMemoizer;

    // Memoized functions for efficiency
    private memoizedRetrieval: RetrievalFunction;
    private memoizedIntegrityCheck: IntegrityCheckFunction;

    constructor(
        retrievalService: ArtifactRetrievalService,
        hasher: CanonicalHashingTool,
        errorSerializer: CanonicalErrorSerializer,
        /** @type {FunctionMemoizer} */
        memoizationUtility
    ) {
        this.retrievalService = retrievalService;
        this.hasher = hasher;
        this.errorSerializer = errorSerializer;
        this.memoizationUtility = memoizationUtility;

        this.#setupMemoizers();
    }

    /**
     * Extracts synchronous dependency configuration into a setup method.
     */
    private #setupMemoizers(): void {
        // Initialize memoized functions using the injected utility
        this.memoizedRetrieval = this.#delegateToMemoizerCreation(
            this.#retrieveAndHashArtifact.bind(this) as RetrievalFunction
        );
        
        // Use a custom key generator for the integrity check based on ID and expected hash
        this.memoizedIntegrityCheck = this.#delegateToMemoizerCreation(
            this.#checkIntegrityLogic.bind(this) as IntegrityCheckFunction,
            ([id, expectedHash]) => `${id}:${expectedHash}` 
        );
    }

    // --- I/O Proxy Methods ---

    private async #delegateToRetrievalService(id: string): Promise<any> {
        return this.retrievalService.retrieve(id);
    }

    private #delegateToHasher(data: any): string {
        return this.hasher.calculateHash(data);
    }

    private #delegateToErrorSerializer(error: Error): any {
        return this.errorSerializer.serialize(error);
    }

    private #delegateToMemoizerCreation<T extends Function>(
        func: T, 
        keyGenerator?: (...args: any[]) => string
    ): T {
        return this.memoizationUtility.createMemoizer(func, keyGenerator);
    }

    /**
     * Step 1: Core logic for artifact retrieval and hashing.
     * Implements lazy loading by fetching only when needed and calculating the hash immediately.
     * @private
     */
    private async #retrieveAndHashArtifact(id: string): Promise<ArtifactData> {
        try {
            const data = await this.#delegateToRetrievalService(id);
            if (!data) {
                const error = new Error(`Artifact ${id} not found during retrieval.`);
                throw this.#delegateToErrorSerializer(error);
            }
            
            // Canonical hashing for integrity baseline
            const hash = this.#delegateToHasher(data); 
            return { data, hash };
        } catch (error) {
            console.error(`Error retrieving artifact ${id}:`, error);
            throw error;
        }
    }

    /**
     * Step 2: Core logic for integrity checking.
     * Uses the memoized retrieval result (functional composition).
     * @private
     */
    private async #checkIntegrityLogic(id: string, expectedHash: string): Promise<boolean> {
        if (!expectedHash) {
            // Integrity is satisfied if no mandate is present
            return true;
        }

        try {
            // Uses memoized retrieval result (cache hit if already fetched)
            const { hash: actualHash } = await this.memoizedRetrieval(id); 

            if (actualHash !== expectedHash) {
                console.error(`Integrity breach detected for artifact ${id}. Expected: ${expectedHash}, Actual: ${actualHash}`);
                return false;
            }
            return true;
        } catch (e) {
            console.error(`Failed integrity check due to underlying retrieval failure for ${id}.`);
            return false;
        }
    }

    /**
     * Executes the preflight workflow using functional composition.
     * Workflow:
     * 1. Check Integrity (Triggers retrieval if uncached)
     * 2. Perform Structural Validation (Uses cached data)
     * @param artifactId ID of the artifact to process.
     * @param expectedHash The mandatory integrity hash.
     * @returns Promise<boolean> True if preflight validation and integrity checks pass.
     */
    public async runPreflight(artifactId: string, expectedHash: string): Promise<boolean> {
        // Composition 1: Memoized Integrity Check
        const integrityPassed = await this.memoizedIntegrityCheck(artifactId, expectedHash);

        if (!integrityPassed) {
            return false;
        }

        // Composition 2: Retrieve the data (guaranteed cache hit, optimizing access)
        try {
            const { data } = await this.memoizedRetrieval(artifactId);
            
            // Composition 3: Perform downstream structural validation
            return this.#performStructuralValidation(data);

        } catch (e) {
            // Retrieval or validation failed
            return false;
        }
    }

    /**
     * Placeholder for structural validation logic (e.g., calling SchemaValidator).
     * @private
     */
    private #performStructuralValidation(data: any): boolean {
        // Implements dynamic dispatch based on artifact structure/type if necessary
        if (typeof data !== 'object' || data === null || !data.artifactIdentifier) {
            return false;
        }
        return true;
    }

    /**
     * Exposed accessor to retrieve the processed artifact data, leveraging memoization.
     */
    public async getArtifactData(artifactId: string): Promise<any | null> {
        try {
            const { data } = await this.memoizedRetrieval(artifactId);
            return data;
        } catch (e) {
            return null;
        }
    }
}