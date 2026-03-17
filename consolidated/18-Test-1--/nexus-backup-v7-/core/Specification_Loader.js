import fs from 'fs/promises';
import path from 'path';
import Logger from './Logger.js';

const DEFAULT_SPEC_PATH = path.resolve(process.cwd(), 'config/XEL_Specification.json');

/**
 * Specification Loader Service (Async): Manages the loading, parsing, and version control 
 * of XEL Specifications.
 * 
 * Decouples I/O from component execution via asynchronous loading and uses explicit 
 * initialization.
 */
class SpecificationLoader {
    /**
     * @param {{ specPath?: string }} config Configuration object.
     */
    constructor(config = {}) {
        this.specPath = config.specPath || DEFAULT_SPEC_PATH;
        this.specification = null;
        this.logger = new Logger('SpecificationLoader');
        this.isLoaded = false;
    }

    /**
     * Initializes the loader by asynchronously reading and parsing the specification file.
     * Must be awaited by the system bootstrapping process.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isLoaded) {
            this.logger.warn("Attempted multiple initialization calls.");
            return;
        }

        this.logger.info(`Attempting to load specification from: ${this.specPath}`);
        
        try {
            const data = await fs.readFile(this.specPath, 'utf8');
            this.specification = JSON.parse(data);
            this.isLoaded = true;
            this.logger.success("XEL Specification loaded successfully.");
        } catch (error) {
            this.logger.fatal(`Failed to load XEL Specification: ${error.message}. Using fallback structure.`);
            // Ensure robustness: Provide a safe, minimal fallback structure
            this.specification = { ComponentSchemas: {} };
            this.isLoaded = true; // Mark as loaded, even if with fallback
            throw new Error(`SPEC_LOAD_FAILURE: Initialization failed: ${error.message}`); 
        }
    }

    /**
     * Retrieves the complete specification object (deep cloned for safety).
     * @returns {object}
     */
    getSpecification() {
        if (!this.isLoaded) {
            throw new Error("Specifications not initialized. Call initialize() first.");
        }
        // Return a clone to protect the internal state from mutation
        return JSON.parse(JSON.stringify(this.specification)); 
    }

    /**
     * Retrieves the Component Schemas section of the specification.
     * @returns {object}
     */
    getComponentSchemas() {
        const spec = this.getSpecification(); 
        if (!spec.ComponentSchemas) {
             throw new Error("Specifications initialized but ComponentSchemas structure is missing.");
        }
        return spec.ComponentSchemas;
    }

    // FUTURE: Implement checkSpecificationVersion(v), hotReload(newPath), validateSelf()...
}

// Export the class definition for external lifecycle management (initiation and awaiting).
export default SpecificationLoader;