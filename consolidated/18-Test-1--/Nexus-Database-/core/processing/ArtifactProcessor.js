const { 
  ResolutionError, 
  GenerationError, 
  ValidationError, 
  HookExecutionError,
  ArtifactBaseError 
} = require('./ArtifactError'); 

/**
 * ArtifactProcessor.js
 * Orchestrates the lifecycle of an ArtifactStructuralDefinition:
 * Dependency resolution, hook execution, generation, and structural validation.
 * 
 * Refactor V94.1: Introduces strict error typing and standardized logging for higher efficiency and reliability in pipeline orchestration.
 */
class ArtifactProcessor {
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

    this.definition = definition;
    this._validator = services.validator;
    // Standardize defaults to no-op methods returning expected structures
    this._resolver = services.resolver || { resolve: async () => ({ inputs: {} }) };
    this._hookExecutor = services.hookExecutor || { execute: async () => {} };
    this._generator = services.generator;
    this._logger = services.logger || console; 
    
    this.artifactId = definition.id || 'N/A';
  }

  /**
   * Internal logging utility, ensuring consistency and context.
   */
  _log(level, message, details) {
    const fullMessage = `[ArtifactProcessor:${this.artifactId}] ${message}`;
    if (this._logger[level]) {
        this._logger[level](fullMessage, details || '');
    } else if (level === 'error') {
        // Ensure console fallback for critical errors
        console.error(fullMessage, details || '');
    }
  }

  /**
   * Executes a named pipeline hook defined in the artifact definition.
   */
  async _executeHooks(hookName, context) {
    const hookRef = this.definition.pipeline?.hooks?.[hookName];
    if (hookRef) {
      this._log('info', `Executing hook: ${hookName}`);
      try {
        await this._hookExecutor.execute(hookRef, context);
      } catch (error) {
        this._log('error', `Failed to execute hook ${hookName}.`, error);
        // Throw structured hook error, allowing strict management of pipeline flow.
        throw new HookExecutionError(`Hook ${hookName} failed`, hookName);
      }
    }
  }

  /**
   * Step 1: Fetches necessary dependencies required for generation.
   */
  async _stepResolveDependencies() {
    this._log('info', `Resolving dependencies.`);
    const dependencyList = this.definition.dependencies || [];
    try {
        return await this._resolver.resolve(dependencyList);
    } catch (error) {
        throw new ResolutionError(`Dependency resolution failed.`, dependencyList);
    }
  }

  /**
   * Step 3: Validates the structure of the generated artifact.
   */
  async _stepValidate(runtimeArtifact) {
    this._log('info', 'Starting structural validation.');
    return this._validator.validate(this.definition.structure, runtimeArtifact);
  }


  /**
   * Main orchestration method to generate the artifact.
   * @returns {Promise<RuntimeArtifact>} The fully processed and validated artifact structure.
   */
  async generate() {
    this._log('info', `Starting pipeline.`);

    // Centralized context for sharing state between steps and hooks
    const context = { 
        definition: this.definition, 
        inputs: null,
        generatedArtifact: null,
        validationResult: null
    };

    try {
        // 1. Resolve Dependencies
        context.inputs = await this._stepResolveDependencies();

        // 2. Pre-Generation Hook
        await this._executeHooks('preGen', context);

        // 3. Primary Generation Logic
        this._log('info', 'Executing generation.');
        const generationPayload = {
            structure: this.definition.structure,
            inputs: context.inputs
        };

        context.generatedArtifact = await this._generator.run(
            this.definition.pipeline.generatorRef,
            generationPayload
        );
        
        // 4. Validation
        context.validationResult = await this._stepValidate(context.generatedArtifact);

        // 5. Post-Validation Hook 
        await this._executeHooks('postValidation', context);

        if (!context.validationResult.success) {
            const validationErrors = context.validationResult.errors || [];
            this._log('warn', `Generation succeeded, but failed structural validation.`);
            
            // Structured Error Throw
            throw new ValidationError(`Structural validation failed`, validationErrors);
        }

        // 6. Post-Generation Success Hook
        await this._executeHooks('postGenSuccess', context.generatedArtifact);

        this._log('info', `Pipeline completed successfully.`);
        return context.generatedArtifact;
        
    } catch (error) {
        // Propagate structured errors (ResolutionError, ValidationError, HookExecutionError)
        if (error instanceof ArtifactBaseError) {
             throw error; 
        } 
        
        // Catch unexpected infrastructure/generation failures and type them.
        this._log('error', `Critical generation failure occurred.`, error);
        throw new GenerationError(`Unexpected failure during generation step.`, this.definition.pipeline?.generatorRef);
    }
  }
}

module.exports = ArtifactProcessor;