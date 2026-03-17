/**
 * Autonomous Code Evolution & Scaffolding (ACE-S) Utility
 * File: protocols/hashing/CanonicalInterfaceGenerator.ts
 *
 * Provides utilities for generating mandatory GSR interface hashes and contract checksums.
 * Refactored into CanonicalInterfaceGeneratorKernel for architectural separation.
 */

// --- Interface Declarations for Dependency Injection ---

interface IIntegrityHashingUtility {
    execute(args: { data: string; algorithm: 'sha256' | 'sha512' }): string;
}

interface IGSRInterfaceHasher {
    execute(args: { rawInterfaceDefinition: string }): string;
}

interface CanonicalInterfaceGeneratorDeps {
    hashingUtility: IIntegrityHashingUtility;
    interfaceHasher: IGSRInterfaceHasher;
}

/**
 * Kernel responsible for standardizing interface hashing and content checksum generation.
 * Encapsulates delegation to specialized hashing utilities.
 */
export class CanonicalInterfaceGeneratorKernel {
    
    private readonly #hashingUtility: IIntegrityHashingUtility;
    private readonly #interfaceHasher: IGSRInterfaceHasher;

    /**
     * @param dependencies - Must include hashingUtility and interfaceHasher.
     */
    constructor(dependencies: CanonicalInterfaceGeneratorDeps) {
        this.#setupDependencies(dependencies);
    }

    // STRATEGIC GOAL: Synchronous Setup Extraction
    private #setupDependencies(deps: CanonicalInterfaceGeneratorDeps): void {
        if (!deps || !deps.hashingUtility || typeof deps.hashingUtility.execute !== 'function') {
            this.#throwSetupError('Missing or invalid IntegrityHashingUtility dependency.');
        }
        if (!deps.interfaceHasher || typeof deps.interfaceHasher.execute !== 'function') {
            this.#throwSetupError('Missing or invalid GSRInterfaceHasher dependency.');
        }

        this.#hashingUtility = deps.hashingUtility;
        this.#interfaceHasher = deps.interfaceHasher;
    }

    // STRATEGIC GOAL: I/O Proxy Creation (Error Handler)
    private #throwSetupError(message: string): never {
        throw new Error(`[CanonicalInterfaceGeneratorKernel Setup Error]: ${message}`);
    }

    /**
     * Generates the mandatory Interface Hash for GSR registration.
     * @param rawInterfaceDefinition - The source code or IDL string.
     * @returns SHA-256 hash string (64 characters).
     */
    public generateInterfaceHash(rawInterfaceDefinition: string): string {
        return this.#delegateToInterfaceHashing(rawInterfaceDefinition);
    }

    /**
     * Utility for generating the contract configuration checksum itself (SHA-256).
     * @param contractJsonContent - The content to hash.
     * @returns SHA-256 hash string (64 characters).
     */
    public generateContractChecksum(contractJsonContent: string): string {
        return this.#delegateToContentHashing(contractJsonContent);
    }
    
    // STRATEGIC GOAL: I/O Proxy Creation (Delegation)
    private #delegateToInterfaceHashing(rawInterfaceDefinition: string): string {
        // Delegates to the specialized GSRInterfaceHasher
        return this.#interfaceHasher.execute({ rawInterfaceDefinition });
    }

    // STRATEGIC GOAL: I/O Proxy Creation (Delegation)
    private #delegateToContentHashing(contractJsonContent: string): string {
        // Delegates to the central IntegrityHashingUtility
        return this.#hashingUtility.execute({
            data: contractJsonContent,
            algorithm: 'sha256'
        });
    }
}