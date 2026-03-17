import { SecureExpressionEvaluator } from '../utils/SecureExpressionEvaluator';

/**
 * @class ConflictResolutionEngine
 * Manages the evaluation of competing operational requests against the CRCM (Conflict Resolution Constraint Model).
 * Utilizes a SecureExpressionEvaluator to safely execute complex weighting formulas.
 * Delegation: Domain-specific control evaluation is handled by the injected ConflictModelEvaluator.
 */
class ConflictResolutionEngine {
  // Rigorous encapsulation for core dependencies and state
  #crcm;
  #evaluator;
  #conflictModelEvaluator;
  #domainMap;
  #evaluatorFn;

  /**
   * @param {Object} crcm - The Conflict Resolution Constraint Model structure.
   * @param {SecureExpressionEvaluator} evaluator - Secure utility for running dynamic CRCM formulas.
   * @param {Object} conflictModelEvaluator - The required plugin/utility to execute CRCM controls.
   */
  constructor(crcm, evaluator, conflictModelEvaluator) {
    this.#setupDependencies(evaluator, conflictModelEvaluator);
    this.#initializeConfiguration(crcm);
  }

  /**
   * Sets up and validates core dependencies, encapsulating injection logic.
   * @param {SecureExpressionEvaluator} evaluator 
   * @param {Object} conflictModelEvaluator 
   */
  #setupDependencies(evaluator, conflictModelEvaluator) {
    if (!evaluator || typeof evaluator.evaluate !== 'function') {
      throw new Error("ConflictResolutionEngine requires a SecureExpressionEvaluator instance.");
    }
    if (!conflictModelEvaluator || typeof conflictModelEvaluator.execute !== 'function') {
      // Enforce explicit dependency injection for the core evaluation logic
      throw new Error("ConflictResolutionEngine requires a ConflictModelEvaluator instance with an 'execute' method.");
    }
    
    this.#evaluator = evaluator;
    this.#conflictModelEvaluator = conflictModelEvaluator;
    
    // Bind the secure evaluator function once for reliable passing to the plugin
    this.#evaluatorFn = this.#evaluator.evaluate.bind(this.#evaluator);
  }

  /**
   * Initializes and prepares the CRCM configuration (freezing and mapping), fulfilling synchronous setup extraction.
   * @param {Object} crcm
   */
  #initializeConfiguration(crcm) {
    // 1. Immutability contract: Freeze the CRCM to ensure conflict rules cannot be modified at runtime.
    this.#crcm = Object.freeze(crcm);
    
    // Pre-process CRCM for O(1) domain lookup, storing the full domain object.
    this.#domainMap = this.#buildDomainMap(crcm.domains);
  }

  /**
   * Pre-processes the CRCM structure for fast lookup by domain_id, storing the full domain context.
   * @param {Array<Object>} domains
   * @returns {Map<string, Object>} Map of domain_id to the full domain object.
   */
  #buildDomainMap(domains) {
    const map = new Map();
    if (domains && Array.isArray(domains)) {
      for (const domain of domains) {
        if (domain.domain_id) {
          // Store the entire domain object for context access (e.g., aggregation type)
          map.set(domain.domain_id, domain);
        }
      }
    }
    return map;
  }

  /**
   * Executes the external Conflict Model Evaluator plugin, serving as an I/O proxy.
   * @param {Array<Object>} controls
   * @param {Object} context
   * @param {string} aggregationMethod
   * @returns {Object} evaluationResult
   */
  #delegateToConflictModelEvaluator({ controls, context, aggregationMethod }) {
    // Delegate scoring and constraint checking to the injected plugin
    return this.#conflictModelEvaluator.execute({
        controls: controls,
        context: context,
        aggregationMethod: aggregationMethod,
        evaluatorFn: this.#evaluatorFn // Pass the secure evaluator function
    });
  }

  /**
   * Evaluates competing requests against CRCM constraints and calculates resolution weight.
   * Finds the single request with the highest calculated priority weight that meets all constraints.
   * 
   * @param {Array<Object>} competingRequests - List of operational requests, each having `appliesTo` (domain ID).
   * @param {Object} currentContext - Runtime context variables (TCS, Urgency, EthicalSeverity).
   * @returns {{winningRequest: Object|null, resolutionWeight: number, resolutionMetadata: Object}}
   */
  resolveConflict(competingRequests, currentContext) {
    if (!Array.isArray(competingRequests) || competingRequests.length === 0) {
      return { winningRequest: null, resolutionWeight: -Infinity, resolutionMetadata: { reason: "No competing requests provided." } };
    }
    if (!currentContext || typeof currentContext !== 'object') {
      // Note: Warning remains, but engine proceeds with potentially incomplete context.
      console.warn("Context missing or invalid in ConflictResolutionEngine.");
    }
    
    let winningRequest = null;
    let highestWeight = -Infinity;
    let resolutionMetadata = {};

    for (const request of competingRequests) {
      const domainId = request.appliesTo;
      // Use private domain map
      const domain = this.#domainMap.get(domainId);

      if (!domain || !Array.isArray(domain.controls)) continue;

      const applicableControls = domain.controls;
      const aggregationMethod = domain.aggregation_method;

      // Use I/O Proxy for delegation
      const evaluationResult = this.#delegateToConflictModelEvaluator({
        controls: applicableControls,
        context: currentContext,
        aggregationMethod: aggregationMethod,
      });
      
      const { score, isViable, violationDetails, appliedControls } = evaluationResult;

      // If the request survived constraints and has a higher weight, it wins
      if (isViable && score > highestWeight) {
        highestWeight = score;
        winningRequest = request;
        resolutionMetadata = { 
          appliedControls: appliedControls,
          domainAggregation: aggregationMethod || 'MAX', 
          violationDetails: null // Clear previous violations
        };
      } else if (!isViable) {
        // Capture rejection metadata for debugging/learning
        if (!resolutionMetadata.rejectedRequests) resolutionMetadata.rejectedRequests = [];
        resolutionMetadata.rejectedRequests.push({ 
          requestId: request.id || 'unknown',
          domainId: domainId,
          violation: violationDetails
        });
      }
    }
    
    // Cleanup metadata if a winner was found
    if (winningRequest && resolutionMetadata.rejectedRequests) {
      delete resolutionMetadata.rejectedRequests;
    }

    return {
      winningRequest: winningRequest,
      resolutionWeight: highestWeight,
      resolutionMetadata: resolutionMetadata
    };
  }
}
module.exports = ConflictResolutionEngine;