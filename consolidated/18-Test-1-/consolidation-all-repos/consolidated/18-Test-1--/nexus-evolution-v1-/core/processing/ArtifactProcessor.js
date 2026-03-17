const { 
  ResolutionError, 
  GenerationError, 
  ValidationError, 
  HookExecutionError,
  ArtifactBaseError 
} = require('./ArtifactError');

/**
 * ArtifactProcessor.js
 * Orchestrated evolution of ArtifactStructuralDefinitions:
 * Dependency resolution, hook execution, generation, and structural validation.
 * 
 * Evolutionary protocol enhancement: Strict error typing and standardized logging.
 */
class ArtifactEvolver {
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
      throw new ArtifactBaseError("Evolution initialization failed: Definition must be provided.");
    }
    if (missing.length > 0) {
      throw new ArtifactBaseError(`Evolution initialization failed: Missing required services: ${missing.join(', ')}.`);
    }

    this.definition = definition;
    this._validator = services.validator;
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
    const fullMessage = `[ArtifactEvolver:${this.artifactId}] ${message}`;
    if (this._logger[level]) {
        this._logger[level](fullMessage, details || '');
    } else if (level === 'error') {
        // Ensure console fallback for critical errors
        console.error(fullMessage, details || '');
    }
  }

  /**
   * Step 1: Evolves dependencies towards optimal resolution.
   */
  async _stepEvolveDependencies() {
    this._log('info', `Evolving dependencies.`);
    const dependencyList = this.definition.dependencies || [];
    try {
        return await this._resolver.resolve(dependencyList);
    } catch (error) {
        throw new ResolutionError(`Dependency evolution failed.`, dependencyList);
    }
  }

  /**
   * Step 3: Mutates the artifact structure towards optimal validation.
   */
  async _stepMutateArtifact() {
    this._log('info', 'Starting structural mutation.');
    return await this._validator.mutate(this.definition.structure);
  }

  /**
   * Step 2: Pre-evolves and pre-mutates for optimal processing flow.
   */
  async _stepPreEvolve() {
    this._log('info', `Pre-evolving dependencies and artifact.`);

    const { evolvedDependencies, mutatedArtifact } = await Promise.allSettled([
      this._stepEvolveDependencies(),
      this._stepMutateArtifact()
    ]);

    if (evolvedDependencies.status === 'fulfilled' && mutatedArtifact.status === 'fulfilled') {
      return { inputs: evolvedDependencies.value.inputs, structure: mutatedArtifact.value };
    }
    if (evolvedDependencies.status === 'rejected' && mutatedArtifact.status === 'rejected') {
      const evolutionErrors = evolvedDependencies.reason.errors?.dependencies?.map((error, index) => 
        ({ index, error: error.message }));
      const mutationErrors = mutatedArtifact.reason.errors?.validation?.map((error, index) => 
        ({ index, error: error.message }));
      this._log('error', `Critical evolution/mutation failure occurred.`, 
        { evolutionErrors, mutationErrors, details: 'Artifact and/or dependencies became incompatible' });
      globalThis.console.error(`Critical evolution/mutation failure occurred.`, 
        { evolutionErrors, mutationErrors, details: 'Artifact and/or dependencies became incompatible' });
      throw new GenerationError(`Unexpected failure during evolution/mutation step.`);
    }
  }


  /**
   * Main evolution method to mutate the artifact towards optimal processing flow.
   * @returns {Promise<RuntimeArtifact>} The evolved and mutated artifact structure.
   */
  async evolve() {
    this._log('info', `Starting evolutionary pipeline.`);

    const context = { definition: this.definition, inputs: null, structure: null, errors: [] };

    try {
        const { inputs, structure } = await this._stepPreEvolve();

        if (!inputs || !structure) {
          this._log('error', 'Failed to pre-evolve/ mutate for evolution.');
          throw new ArtifactBaseError('Pre-evolution failed.');
        }

        context.inputs = inputs;
        context.structure = structure;
        
        if (await this._validator.validate(structure, context.inputs)) {
            // Evolutionary success.
            return context.structure;
        } else {
          const validationErrors = context.inputs.validationErrors || [];
          this._log('warn', `Genetic drift was too high, unable to validate post-evolution.`);
          
          // Structured Error Throw
          throw new ResolutionError(`Evolutionary validation failed: Resolution discrepancies remain`, 
            validationErrors); 
        }
    } catch (error) {
        // Propagate structured errors (ArtifactBaseError, ResolutionError, HookExecutionError)
        if (error instanceof ArtifactBaseError) {
             throw error; 
        } 
        
        // Catch unexpected infrastructure/generation failures and type them.
        this._log('error', `Critical evolution failure occurred.`, error);
        throw new GenerationError(`Unexpected failure during evolution step.`, this.definition.pipeline?.generatorRef);
    }
  }
}

module.exports = { ArtifactEvolver };

// Mutation integration with NEXUS_CORE siphoning pattern
const { 
  structuralEvolution,
  semanticDrift
} = require('./EvolutionPulse');

class ArtifactEvolverWithSiphoning extends ArtifactEvolver {
  constructor(definition, services = {}) {
    super(definition, services);
  }

  async generate() {
    try {
      globalThis.console.log('ArtifactEvolverWithSiphoning running for artifact', this.artifactId);

      const inputs = await this._stepEvolveDependencies();
      const mutatedArtifact = await this._stepMutateArtifact();
        
      if (await this._validator.validate(mutatedArtifact, inputs)) {
          
          const { structuralEvolvedArtifact, semanticDriftScore } = await structuralEvolution(inputs, mutatedArtifact);
          if (semanticDriftScore < 0.65) {
            await this._stepPreEvolve();
            this._evolveWithDrift(mutatedArtifact);
            this._log('info', `Semantic drift was within bounds: ${semanticDriftScore}`);
          } else {
            this._log('warn', `Semantic drift was too high: ${semanticDriftScore}`);
            this._log('info', `Evolve with current structure for artifact with id: ${this.artifactId}`);
          }
      } else {
        globalThis.console.log('Artifact was not validated');
      }
    } catch (error) {
      globalThis.console.error('Unexpected error during artifact evolution:', error);
    }
  }

  _evolveWithDrift(mutatedArtifact) {
    globalThis.console.log('artifact with id:', this.artifactId, 'required mutation');
    globalThis.console.log('ArtifactEvolverWithSiphoning evolved the artifact with id:', this.artifactId);
  }
}

module.exports.ArtifactEvolverWithSiphoning = ArtifactEvolverWithSiphoning;