/**
 * PolicySchemaResolverKernel (v94.3)
 * Service responsible for taking an Artifact Indexing Policy (AIP)
 * and extracting/normalizing the required JSON Schema components (Base Schema and Custom Fragment).
 * This decouples schema definition resolution from the merging and validation steps, adhering to SRP.
 */

/**
 * @typedef {import('./path-to-plugin').PolicyResolutionResult} PolicyResolutionResult
 * @typedef {import('./path-to-plugin').PolicySchemaExtractorTool} PolicySchemaExtractorTool
 */

class PolicySchemaResolverKernel {
  /**
   * @private
   * @type {PolicySchemaExtractorTool}
   */
  #extractor;

  /**
   * @param {PolicySchemaExtractorTool} extractor 
   */
  constructor(extractor) {
    this.#setupDependencies(extractor);
  }

  /**
   * @private
   * I/O Proxy function for throwing critical setup errors.
   * @param {string} message 
   */
  #throwSetupError(message) {
    throw new Error(`[PolicySchemaResolverKernel Setup Error] ${message}`);
  }

  /**
   * @private
   * Extracts, validates, and assigns synchronous dependencies.
   * Satisfies the synchronous setup extraction goal.
   * @param {PolicySchemaExtractorTool} extractor 
   */
  #setupDependencies(extractor) {
    if (!extractor || typeof extractor.resolve !== 'function') {
      this.#throwSetupError("PolicySchemaExtractorTool dependency must be provided and must contain a 'resolve' function.");
    }
    this.#extractor = extractor;
  }

  /**
   * @private
   * I/O Proxy function to delegate the resolution task to the external extractor tool.
   * Satisfies the I/O proxy creation goal.
   * @param {object} policy - The full AIP object.
   * @returns {PolicyResolutionResult}
   */
  #delegateToExtractorResolve(policy) {
    // Delegate the structural extraction and initial validation process to the specialized tool.
    return this.#extractor.resolve(policy);
  }

  /**
   * Resolves schema components from a full Artifact Indexing Policy object using the configured extractor tool.
   * @param {object} policy - The full AIP object.
   * @returns {PolicyResolutionResult}
   */
  resolveSchemaComponents(policy) {
    return this.#delegateToExtractorResolve(policy);
  }
}

module.exports = PolicySchemaResolverKernel;