/**
 * @file GovernanceThresholdConfigRegistryKernel.js
 * @component Governance Threshold Configuration Registry (L7)
 *
 * Asynchronously loads, validates, transforms, and deep-freezes the core failure manifest.
 * This upholds the Axiomatic contract (COF/P-01) by ensuring configuration immutability
 * and replacing synchronous I/O and static dependency coupling with rigorous Dependency Injection (DI).
 */

import { ISecureResourceLoaderInterfaceKernel } from '../interfaces/ISecureResourceLoaderInterfaceKernel';
import { IPathRegistryKernel } from '../interfaces/IPathRegistryKernel';
import { IConfigurationDeepFreezeToolKernel } from '../interfaces/IConfigurationDeepFreezeToolKernel';
import { ILoggerToolKernel } from '../interfaces/ILoggerToolKernel';

const THRESHOLD_MANIFEST_PATH_KEY = 'coreFailureThresholdsManifestPath';

export class GovernanceThresholdConfigRegistryKernel {
    #resourceLoader;
    #pathRegistry;
    #deepFreezeUtility;
    #logger;
    #coreFailureManifest;
    #isInitialized = false;
    
    /**
     * @param {object} dependencies
     * @param {ISecureResourceLoaderInterfaceKernel} dependencies.ISecureResourceLoaderInterfaceKernel
     * @param {IPathRegistryKernel} dependencies.IPathRegistryKernel
     * @param {IConfigurationDeepFreezeToolKernel} dependencies.IConfigurationDeepFreezeToolKernel
     * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Strictly isolates synchronous dependency assignment and validation.
     * @param {object} dependencies
     */
    #setupDependencies(dependencies) {
        if (!dependencies.ISecureResourceLoaderInterfaceKernel) {
            throw new Error("Dependency ISecureResourceLoaderInterfaceKernel is required.");
        }
        if (!dependencies.IPathRegistryKernel) {
            throw new Error("Dependency IPathRegistryKernel is required.");
        }
        if (!dependencies.IConfigurationDeepFreezeToolKernel) {
             throw new Error("Dependency IConfigurationDeepFreezeToolKernel is required.");
        }
        if (!dependencies.ILoggerToolKernel) {
             throw new Error("Dependency ILoggerToolKernel is required.");
        }

        this.#resourceLoader = dependencies.ISecureResourceLoaderInterfaceKernel;
        this.#pathRegistry = dependencies.IPathRegistryKernel;
        this.#deepFreezeUtility = dependencies.IConfigurationDeepFreezeToolKernel;
        this.#logger = dependencies.ILoggerToolKernel;
    }

    /**
     * Asynchronously initializes the Core Failure Manifest.
     * Loads the raw JSON, applies structural transformation, and deep freezes the result.
     */
    async initialize() {
        if (this.#isInitialized) {
            this.#logger.warn("GovernanceThresholdConfigRegistryKernel already initialized.");
            return;
        }

        const manifestPath = this.#pathRegistry.getPath(THRESHOLD_MANIFEST_PATH_KEY);
        
        if (!manifestPath) {
             throw new Error(`Path for ${THRESHOLD_MANIFEST_PATH_KEY} not registered in PathRegistry.`);
        }

        try {
            // 1. Load the raw manifest asynchronously (replaces static synchronous import)
            const rawManifest = await this.#resourceLoader.loadJson(manifestPath);

            // 2. Apply structural transformation and normalization (e.g., lowercase 'version' to uppercase 'VERSION')
            const processedManifest = {
                VERSION: rawManifest.version,
                
                CONSTANTS: {
                    TAU_NORM: rawManifest.CONSTANTS.TAU_NORM,
                    EPSILON_MIN: rawManifest.CONSTANTS.EPSILON_MIN
                },
            
                THRESHOLDS: rawManifest.THRESHOLDS
            };

            // 3. Deep freeze the final structure (replaces static call to ImmutableConfigImporter.load())
            this.#coreFailureManifest = this.#deepFreezeUtility.deepFreeze(processedManifest);

            this.#isInitialized = true;
            this.#logger.info("Core Failure Threshold Manifest loaded and frozen.");

        } catch (error) {
            this.#logger.error(`Failed to initialize Governance Thresholds: ${error.message}`);
            throw new Error(`Failed to load Core Failure Manifest from ${manifestPath}: ${error.message}`);
        }
    }

    /**
     * Retrieves the deeply frozen Core Failure Manifest.
     * @returns {object} The immutable configuration object.
     */
    getCoreFailureManifest() {
        if (!this.#isInitialized) {
            throw new Error("GovernanceThresholdConfigRegistryKernel not initialized. Call initialize() first.");
        }
        return this.#coreFailureManifest;
    }
}