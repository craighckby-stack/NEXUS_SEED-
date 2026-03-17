import { SecureExpressionEvaluator } from '../utils/SecureExpressionEvaluator';

/**
 * @class ConflictResolutionEngine
 * Manages the evaluation of competing operational requests against the CRCM (Conflict Resolution Constraint Model).
 * Utilizes a SecureExpressionEvaluator to safely execute complex weighting formulas.
 */
class ConflictResolutionEngine {
  /**
   * @param {Object} crcm - The Conflict Resolution Constraint Model structure.
   * @param {SecureExpressionEvaluator} evaluator - Secure utility for running dynamic CRCM formulas.
   */
  constructor(crcm, evaluator) {
    if (!evaluator || typeof evaluator.evaluate !== 'function') {
        throw new Error("ConflictResolutionEngine requires a SecureExpressionEvaluator instance.");
    }
    this.crcm = crcm;
    this.evaluator = evaluator;
    // Pre-process CRCM for O(1) domain lookup
    this.domainControlMap = this._buildDomainControlMap(crcm.domains);
  }

  /**
   * Pre-processes the CRCM structure for fast lookup by domain_id.
   * @param {Array<Object>} domains
   * @returns {Map<string, Array<Object>>}
   */
  _buildDomainControlMap(domains) {
    const map = new Map();
    if (domains) {
        for (const domain of domains) {
            map.set(domain.domain_id, domain.controls);
        }
    }
    return map;
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
    let winningRequest = null;
    let highestWeight = -Infinity;
    let resolutionMetadata = {};

    for (const request of competingRequests) {
      const domainId = request.appliesTo;
      const applicableControls = this.domainControlMap.get(domainId);

      if (!applicableControls) continue;

      let currentRequestWeight = 0;
      let violatedConstraint = false;
      let appliedControls = [];

      for (const control of applicableControls) {
        // Use the injected secure evaluator instead of unsafe eval()
        const calculatedValue = this.evaluator.evaluate(control.weight_formula, currentContext);
        
        appliedControls.push({ controlId: control.id, type: control.control_type, value: calculatedValue });

        // 1. Check for VETO constraints first
        // Assuming CONSTRAINT_POLICY returns 0 if violated, 1 or more if met.
        if (control.control_type === 'CONSTRAINT_POLICY' && calculatedValue === 0) {
          violatedConstraint = true;
          currentRequestWeight = -Infinity; // Immediate veto
          break; 
        }

        // 2. Determine Priority Weight (take the max applicable priority weight)
        if (control.control_type === 'PRIORITY_WEIGHT') {
            currentRequestWeight = Math.max(currentRequestWeight, calculatedValue);
        }
      }

      // If the request survived constraints and has a higher weight, it wins
      if (!violatedConstraint && currentRequestWeight > highestWeight) {
        highestWeight = currentRequestWeight;
        winningRequest = request;
        resolutionMetadata = { appliedControls };
      }
    }

    return {
      winningRequest: winningRequest,
      resolutionWeight: highestWeight,
      resolutionMetadata: resolutionMetadata
    };
  }
}
module.exports = ConflictResolutionEngine;