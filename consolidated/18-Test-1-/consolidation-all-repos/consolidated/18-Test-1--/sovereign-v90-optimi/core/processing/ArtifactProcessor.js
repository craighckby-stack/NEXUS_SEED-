const {
  ResolutionError,
  GenerationError,
  ValidationError,
  HookExecutionError,
  ArtifactBaseError
} = require('./ArtifactError');
// NOTE: ContextualLogger dependency is assumed to be resolved (e.g., required from a utility path).

/**
 * ArtifactProcessor.js
 * Orchestrates the lifecycle of an ArtifactStructuralDefinition:
 * Dependency resolution, hook execution, generation, and structural validation.
 *
 * Refactor V94.4: Strict encapsulation, synchronous setup extraction, and I/O proxy creation enforced.
 */
class ArtifactProcessor {
  // Core configuration and state (private)
  #definition;
  #artifactId;
  #logger; 

  // Core dependencies (private)
  #validator;
  #resolver;
  #hookExecutor;
  #generator;

  /**
   * @param {ArtifactStructuralDefinition} definition The artifact definition structure.
   * @param {Object} services
   * @param {ArtifactValidator} services.validator
   * @param {DependencyResolver} services.resolver
   * @param {HookExecutor} services.hookExecutor
   * @param {CodeGenerator} services.generator
   * @param {Logger} services.logger
   */
  constructor(definition, services = {}) {
    const requiredServices = ['generator', 'validator'];
    const missing = requiredServices.filter(s => !services[s]);

    if (!definition) {
      throw new ArtifactBaseError("Processor initialization failed: Definition must be provided.");
    }
    if (missing.length > 0) {
      throw new ArtifactBaseError(`Processor initialization failed: Missing required services: ${missing.join(', ')}.`);
    }

    // 1. Dependency Assignment
    this.#setupDependencies(services);
    
    // 2. Synchronous Configuration and Logger Setup
    this.#initializeConfiguration(definition, services);
  }

  /**
   * Isolates dependency assignment and default handling.
   * @param {Object} services
   */
  #setupDependencies(services) {
    this.#validator = services.validator;
    // Standardize defaults to no-op methods returning expected structures
    this.#resolver = services.resolver || { resolve: async () => ({ inputs: {} }) };
    this.#hookExecutor = services.hookExecutor || { execute: async () => {} };
    this.#generator = services.generator;
  }

  /**
   * Isolates synchronous configuration definition and logger initialization.
   * @param {ArtifactStructuralDefinition} definition
   * @param {Object} services
   */
  #initializeConfiguration(definition, services) {
    this.#definition = definition;
    this.#artifactId = definition.id || 'N/A';

    // Initialize logger (maintaining existing ContextualLogger initialization pattern)
    const BaseLogger = services.logger || console;
    // Assumes ContextualLogger is available in scope
    this.#logger = new ContextualLogger(`ArtifactProcessor:${this.#artifactId}`, BaseLogger);
  }

  // --- I/O Proxy Functions ---

  async #delegateToHookExecutor(hookRef, context) {
    return this.#hookExecutor.execute(hookRef, context);
  }

  async #delegateToDependencyResolver(dependencyList) {
    return this.#resolver.resolve(dependencyList);
  }

  async #delegateToArtifactValidator(structure, runtimeArtifact) {
    return this.#validator.validate(structure, runtimeArtifact);
  }

  async #delegateToCodeGenerator(generatorRef, generationPayload) {
    return this.#generator.run(generatorRef, generationPayload);
  }

  // --- Orchestration Steps ---

  /**
   * Executes a named pipeline hook defined in the artifact definition.
   */
  async #executeHooks(hookName, context) {
    const hookRef = this.#definition.pipeline?.hooks?.[hookName];
    if (hookRef) {
      this.#logger.info(`Executing hook: ${hookName}`);
      try {
        await this.#delegateToHookExecutor(hookRef, context);
      } catch (error) {
        this.#logger.error(`Failed to execute hook ${hookName}.`, error);
        // Throw structured hook error, allowing strict management of pipeline flow.
        throw new HookExecutionError(`Hook ${hookName} failed`, hookName);
      }
    }
  }

  /**
   * Step 1: Fetches necessary dependencies required for generation.
   */
  async #stepResolveDependencies() {
    this.#logger.info(`Resolving dependencies.`);
    const dependencyList = this.#definition.dependencies || [];
    try {
        return await this.#delegateToDependencyResolver(dependencyList);
    } catch (error) {
        this.#logger.error(`Dependency resolution failed for artifact ${this.#artifactId}.`, error);
        throw new ResolutionError(`Dependency resolution failed.`, dependencyList);
    }
  }

  /**
   * Step 3: Validates the structure of the generated artifact.
   */
  async #stepValidate(runtimeArtifact) {
    this.#logger.info('Starting structural validation.');
    return this.#delegateToArtifactValidator(this.#definition.structure, runtimeArtifact);
  }


  /**
   * Main orchestration method to generate the artifact.
   * @returns {Promise<RuntimeArtifact>} The fully processed and validated artifact structure.
   */
  async generate() {
    this.#logger.info(`Starting pipeline.`);

    // Centralized context for sharing state between steps and hooks
    const context = { 
        definition: this.#definition, 
        inputs: null,
        generatedArtifact: null,
        validationResult: null
    };

    try {
        // 1. Resolve Dependencies
        context.inputs = await this.#stepResolveDependencies();

        // 2. Pre-Generation Hook
        await this.#executeHooks('preGen', context);

        // 3. Primary Generation Logic
        this.#logger.info('Executing generation.');
        const generationPayload = {
            structure: this.#definition.structure,
            inputs: context.inputs
        };

        context.generatedArtifact = await this.#delegateToCodeGenerator(
            this.#definition.pipeline.generatorRef,
            generationPayload
        );
        
        // 4. Validation
        context.validationResult = await this.#stepValidate(context.generatedArtifact);

        // 5. Post-Validation Hook 
        await this.#executeHooks('postValidation', context);

        if (!context.validationResult.success) {
            const validationErrors = context.validationResult.errors || [];
            this.#logger.warn(`Generation succeeded, but failed structural validation.`);
            
            // Structured Error Throw
            throw new ValidationError(`Structural validation failed`, validationErrors);
        }

        // 6. Post-Generation Success Hook
        await this.#executeHooks('postGenSuccess', context.generatedArtifact);

        this.#logger.info(`Pipeline completed successfully.`);
        return context.generatedArtifact;
        
    } catch (error) {
        // Propagate structured errors (ResolutionError, ValidationError, HookExecutionError)
        if (error instanceof ArtifactBaseError) {
             throw error; 
        } 
        
        // Catch unexpected infrastructure/generation failures and type them.
        this.#logger.error(`Critical generation failure occurred.`, error);
        throw new GenerationError(`Unexpected failure during generation step.`, this.#definition.pipeline?.generatorRef);
    }
  }
}

module.exports = ArtifactProcessor;