import path from 'path';
import Logger from './Logger.js';
import ImmutableAsyncDataStore from './ImmutableAsyncDataStore.js';

const DEFAULT_SPEC_PATH = path.resolve(process.cwd(), 'config/XEL_Specification.json');
const FALLBACK_SPEC = Object.freeze({
    ComponentSchemas: Object.freeze({})
});

/**
 * Manages loading, parsing, and version control of XEL Specifications.
 * Uses an asynchronous data store for I/O operations.
 */
class SpecificationLoader {
    #specPath;
    #logger;
    #store;

    /**
     * @param {{ specPath?: string }} config Configuration object.
     */
    constructor(config = {}) {
        this.#specPath = config.specPath ?? DEFAULT_SPEC_PATH;
        this.#logger = new Logger('SpecificationLoader');
        this.#store = this.#createDataStore();
    }

    /**
     * Creates and validates the data store instance.
     * @returns {ImmutableAsyncDataStore}
     * @private
     */
    #createDataStore() {
        try {
            return new ImmutableAsyncDataStore(this.#specPath, this.#logger);
        } catch (error) {
            throw new Error(`Failed to instantiate ImmutableAsyncDataStore: ${error.message}`);
        }
    }

    /**
     * Initializes the loader by reading and parsing the specification file.
     * @returns {Promise<void>}
     */
    async initialize() {
        this.#logger.info(`Initializing specification store: ${this.#specPath}`);

        try {
            await this.#store.initialize(FALLBACK_SPEC);
            this.#logger.success("XEL Specification initialized successfully.");
        } catch (error) {
            this.#logger.error(`Specification initialization failed: ${this.#specPath}`, error);
            throw new Error(`Specification initialization failed: ${error.message}`);
        }
    }

    /**
     * Retrieves the complete specification object.
     * @returns {object}
     */
    getSpecification() {
        return this.#store.getData();
    }

    /**
     * Retrieves the Component Schemas section of the specification.
     * @returns {object}
     * @throws {Error} If ComponentSchemas structure is missing.
     */
    getComponentSchemas() {
        const spec = this.getSpecification();
        if (!spec.ComponentSchemas) {
            throw new Error("Specifications initialized but 'ComponentSchemas' structure is missing.");
        }
        return spec.ComponentSchemas;
    }
}

export default SpecificationLoader;
