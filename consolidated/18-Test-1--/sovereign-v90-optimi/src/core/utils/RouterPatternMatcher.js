import { ILoggerToolKernel } from '@core/logging/ILoggerToolKernel';

/**
 * @interface IPathMatcherToolKernel
 * Defines the interface for performing robust URI pattern matching, 
 * supporting path parameters and complex globbing, abstracting the
 * underlying matching engine.
 */
class IPathMatcherToolKernel {
    /**
     * Checks if a target path matches a given pattern.
     * @param {string} targetPath - The incoming URI path.
     * @param {string} pattern - The configured pattern.
     * @returns {Promise<boolean>} True if matched.
     */
    async matches(targetPath, pattern) {
        throw new Error('Method not implemented.');
    }
}

/**
 * Kernel responsible for robust URI pattern matching based on configured policies.
 * It abstracts the specific path matching implementation behind the IPathMatcherToolKernel interface.
 */
export class RouterPatternMatcherKernel {
    /** @type {IPathMatcherToolKernel} */
    #pathMatcherTool;
    /** @type {ILoggerToolKernel} */
    #logger;

    /**
     * @param {object} dependencies
     * @param {IPathMatcherToolKernel} dependencies.pathMatcherTool
     * @param {ILoggerToolKernel} dependencies.logger
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Enforces Dependency Injection and ensures all required components are present.
     * Rigorously satisfies the synchronous setup extraction mandate.
     * @param {object} dependencies
     */
    #setupDependencies(dependencies) {
        if (!dependencies.pathMatcherTool || typeof dependencies.pathMatcherTool.matches !== 'function') {
            throw new Error("RouterPatternMatcherKernel requires a valid IPathMatcherToolKernel with an 'matches' method.");
        }
        if (!dependencies.logger) {
            throw new Error("RouterPatternMatcherKernel requires a valid ILoggerToolKernel.");
        }
        this.#pathMatcherTool = dependencies.pathMatcherTool;
        this.#logger = dependencies.logger;
    }

    /**
     * Standard asynchronous initialization hook.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Adheres to the standard kernel structure.
    }

    /**
     * Checks if a target path matches a given pattern using the injected Path Matcher Tool.
     * 
     * @param {string} targetPath - The incoming URI path (e.g., '/users/123/details').
     * @param {string} pattern - The configured pattern (e.g., '/users/:id/*').
     * @returns {Promise<boolean>} True if matched.
     */
    async matches(targetPath, pattern) {
        try {
            // Delegate the complex pattern matching to the injected tool
            return await this.#pathMatcherTool.matches(targetPath, pattern);
        } catch (error) {
            this.#logger.error(
                `RouterPatternMatcherKernel failed to execute matching for target path: '${targetPath}' against pattern: '${pattern}'. Falling back to 'false'.`,
                error
            );
            return false;
        }
    }
}