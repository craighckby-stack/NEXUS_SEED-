import { IndexedConstraintMap, ConstraintDefinition } from './GaxConstraintEnforcer';
// NOTE: The dependency GaxIndexingFallback is now expected to be injected via the constructor.

// Interface representing the raw input configuration file (often nested/inherited structure)
export interface ConstraintConfig {
  services: Record<string, any>; 
  defaults: ConstraintDefinition[];
}

// --- New Interfaces for Explicit Injection ---

/** Defines the expected interface for the complex, primary constraint indexing utility. */
interface IConfigIndexingUtility {
    flattenAndIndex(config: ConstraintConfig): IndexedConstraintMap;
}

/** Defines the expected interface for the fallback indexing utility (e.g., GaxIndexingFallback class). */
interface IGaxIndexingFallbackModule {
    createBasicIndex(config: ConstraintConfig, mapCtor: new () => IndexedConstraintMap): IndexedConstraintMap;
}

interface GaxConstraintIndexerDependencies {
    /** The complex, optimizing indexer utility (Optional, allowing internal fallback). */
    indexerUtility?: IConfigIndexingUtility; 
    /** The fallback implementation utility, typically the imported GaxIndexingFallback module/class. */
    fallbackUtility: IGaxIndexingFallbackModule;
}

/**
 * GaxConstraintIndexerKernel is responsible for delegating the parsing and transformation
 * of raw, inherited constraint configurations to an external utility, providing a
 * basic index via an injected fallback mechanism if the utility is not available.
 *
 * Adheres to: Kernelization, State Privatization, Synchronous Setup Extraction, I/O Proxy Creation.
 */
export class GaxConstraintIndexerKernel {
  
    #indexerUtility: IConfigIndexingUtility | undefined;
    #fallbackUtility: IGaxIndexingFallbackModule;

    constructor(dependencies: GaxConstraintIndexerDependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Rigorously extracts synchronous dependency validation and assignment.
     */
    #setupDependencies(dependencies: GaxConstraintIndexerDependencies): void {
        const { indexerUtility, fallbackUtility } = dependencies;

        if (!fallbackUtility || typeof fallbackUtility.createBasicIndex !== 'function') {
            this.#throwSetupError("Fallback utility dependency must be a valid module/class with 'createBasicIndex' method.");
        }
        
        this.#indexerUtility = indexerUtility;
        this.#fallbackUtility = fallbackUtility;
    }

    /**
     * I/O Proxy: Throws an initialization error.
     */
    #throwSetupError(message: string): never {
        throw new Error(`[GaxConstraintIndexerKernel Setup Error]: ${message}`);
    }

    /**
     * Control Flow Proxy: Checks availability of the primary indexer.
     */
    #isPrimaryIndexerAvailable(): boolean {
        const indexer = this.#indexerUtility;
        return !!indexer && typeof indexer.flattenAndIndex === 'function';
    }
    
    /**
     * I/O Proxy: Logs the fallback usage warning.
     */
    #logFallbackWarning(): void {
        console.error("[GAX Indexer]: Primary indexer unavailable. Using basic fallback stub.");
    }

    /**
     * I/O Proxy: Delegates execution to the main indexing utility.
     */
    #delegateToPrimaryIndexer(config: ConstraintConfig): IndexedConstraintMap {
        return this.#indexerUtility!.flattenAndIndex(config);
    }

    /**
     * I/O Proxy: Delegates execution to the fallback index creation utility.
     */
    #delegateToFallbackIndexing(config: ConstraintConfig): IndexedConstraintMap {
        // Pass the Map constructor reference required by the fallback implementation
        return this.#fallbackUtility.createBasicIndex(
            config,
            Map as new () => IndexedConstraintMap
        );
    }

    /**
     * Processes raw constraint configuration to create an efficient runtime index.
     */
    public buildIndex(config: ConstraintConfig): IndexedConstraintMap {
        if (this.#isPrimaryIndexerAvailable()) {
            return this.#delegateToPrimaryIndexer(config);
        }

        // CRITICAL FALLBACK Handling:
        this.#logFallbackWarning();
        return this.#delegateToFallbackIndexing(config);
    }
}