import { KernelBase } from '../kernel/KernelBase';
import { IConceptIdRegistryKernel } from '../registry/IConceptIdRegistryKernel';
import { IContextResolutionMapperToolKernel } from '../../tools/IContextResolutionMapperToolKernel';
import { IConceptualScopeMapperKernel } from './IConceptualScopeMapperKernel';

/**
 * ConceptualScopeMapperKernel is responsible for mapping execution contexts, policies, or data
 * inputs to relevant conceptual scopes, ensuring integrity checks are applied correctly.
 * It utilizes an injected specialized tool for efficient, recursive mapping logic.
 */
class ConceptualScopeMapperKernel extends KernelBase implements IConceptualScopeMapperKernel {
    /** @type {IConceptIdRegistryKernel} */
    #conceptIdRegistry;
    /** @type {IContextResolutionMapperToolKernel} */
    #resolutionMapperTool;

    /**
     * @param {object} dependencies
     * @param {IConceptIdRegistryKernel} dependencies.conceptIdRegistry
     * @param {IContextResolutionMapperToolKernel} dependencies.contextResolutionMapperTool
     */
    constructor(dependencies) {
        super(dependencies);
        this.name = 'ConceptualScopeMapperKernel';
        this.#setupDependencies(dependencies);
    }

    /**
     * Rigorously sets up and validates required dependencies.
     * @param {object} dependencies
     */
    #setupDependencies(dependencies) {
        this.#conceptIdRegistry = this._resolveDependency(
            dependencies,
            'conceptIdRegistry',
            'IConceptIdRegistryKernel'
        );
        // Note: Renamed dependency key to match IContextResolutionMapperToolKernel usage if available
        this.#resolutionMapperTool = this._resolveDependency(
            dependencies,
            'contextResolutionMapperTool',
            'IContextResolutionMapperToolKernel'
        );
    }

    /**
     * @override
     */
    async initialize() {
        // Ensuring key dependencies are initialized
        await Promise.all([
            this.#conceptIdRegistry.initialize(),
            this.#resolutionMapperTool.initialize()
        ]);
        this.isInitialized = true;
    }

    /**
     * Maps a given resolution context to a list of relevant conceptual scopes (IDs).
     * It uses the specialized resolution mapper tool and validates results against the Concept ID Registry.
     * @param {ConceptualResolutionContext} context - The context object containing resolution criteria (e.g., policy ID, audit target).
     * @returns {Promise<string[]>} A promise resolving to an array of validated conceptual scope IDs.
     */
    async mapContextToScopes(context) {
        this._checkInitialization();
        
        if (!context) {
            this.logger.warn('Received null context for scope mapping. Returning empty array.');
            return [];
        }

        // 1. Delegate core recursive mapping logic to the injected tool
        const potentialScopes = await this.#resolutionMapperTool.resolveContextMapping(context);
        
        if (!Array.isArray(potentialScopes) || potentialScopes.length === 0) {
            return [];
        }

        // 2. Filter and validate potential scopes against the canonical registry
        const validationPromises = potentialScopes.map(scopeId => 
            this.#conceptIdRegistry.hasConceptId(scopeId).then(isValid => ({
                scopeId,
                isValid
            }))
        );

        const validatedResults = await Promise.all(validationPromises);

        const validScopes = validatedResults
            .filter(res => res.isValid)
            .map(res => res.scopeId);
        
        const invalidScopes = validatedResults
            .filter(res => !res.isValid)
            .map(res => res.scopeId);

        if (invalidScopes.length > 0) {
            this.logger.warn(`Filtered out invalid conceptual scope IDs: ${invalidScopes.join(', ')}`);
        }

        return validScopes;
    }
}

export default ConceptualScopeMapperKernel;