/**
 * Dialect Analysis Normalization Kernel (DANK)
 * Abstracts lookup, conflict resolution, and caching of dialect/tone mappings.
 * Utilizes CascadedMappingResolverTool for efficient multi-stage text analysis.
 * Refactored into a Kernel structure for rigorous architectural separation.
 */

const mapConfig = require('../config/dial_analysis_map.json');
const CascadedMappingResolverTool = require('@kernel/plugins/CascadedMappingResolverTool');

class DialectNormalizationKernel {
  // Rigorously privatized state
  #resolver;
  #config;

  constructor(config = mapConfig, ResolverTool = CascadedMappingResolverTool) {
    this.#setupDependencies(config, ResolverTool);
  }

  /**
   * Goal: Synchronous Setup Extraction
   * Handles configuration loading, validation, and dependency initialization.
   */
  #setupDependencies(config, ResolverTool) {
    if (!config || typeof config.version === 'undefined') {
        this.#throwSetupError("Configuration map is invalid or missing version metadata.");
    }
    if (!ResolverTool || typeof ResolverTool.initialize !== 'function') {
        this.#throwSetupError("Required dependency 'CascadedMappingResolverTool' is invalid.");
    }

    this.#config = config;
    
    try {
        // Initialize the stateful resolver instance using the configuration map.
        this.#resolver = ResolverTool.initialize(this.#config);
    } catch (e) {
        this.#throwSetupError(`Failed to initialize resolver tool: ${e.message}`);
    }

    this.#logInitializationSuccess();
  }

  /**
   * Goal: I/O Proxy Creation (Logging)
   */
  #logInitializationSuccess() {
    console.log(`DialectNormalizationKernel initialized using CascadedMappingResolverTool with version ${this.#config.version}`);
  }
  
  /**
   * Goal: I/O Proxy Creation (Error Throwing)
   */
  #throwSetupError(message) {
    throw new Error(`[DialectNormalizationKernel Setup Error]: ${message}`);
  }

  /**
   * Public interface method.
   * @param {string} text - The text to analyze.
   */
  analyze(text) {
    // Delegate the entire complex analysis pipeline to the extracted tool via a proxy.
    return this.#delegateToResolver(text);
  }

  /**
   * Goal: I/O Proxy Creation (External Tool Delegation)
   */
  #delegateToResolver(text) {
    return this.#resolver.execute(text);
  }
}

// Export the instantiated Kernel
module.exports = new DialectNormalizationKernel();