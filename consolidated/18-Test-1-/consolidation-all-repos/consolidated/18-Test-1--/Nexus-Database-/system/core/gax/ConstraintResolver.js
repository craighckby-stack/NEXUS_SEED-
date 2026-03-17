import { ConstraintPolicy } from './PolicyTypes';

/**
 * ConstraintResolver V94.1
 * Loads, validates, and dynamically resolves GAX constraints based on execution context.
 */
class ConstraintResolver {
  constructor(constraintConfig) {
    this.policies = constraintConfig.policies || {};
    this.constraints = constraintConfig.constraints || {};
    this.defaultPolicy = this.policies.DEFAULT_POLICY || [];
  }

  /**
   * Resolves the constraints applicable to a specific service method.
   * @param {string} serviceMethodKey e.g., 'ServiceA/HighVolumeWrite'
   * @returns {Array<Object>}
   */
  resolve(serviceMethodKey) {
    const policyKey = serviceMethodKey;

    if (this.policies[policyKey]) {
      // 1. Method-specific Policy
      const appliedConstraints = this.policies[policyKey].map(ref => 
        ref.constraint_ref ? this.constraints[ref.constraint_ref] : ref
      );
      return appliedConstraints.filter(c => c);
    } 

    // 2. Default Policy Fallback
    const defaultApplied = this.defaultPolicy.map(ref => 
      ref.constraint_ref ? this.constraints[ref.constraint_ref] : ref
    );
    return defaultApplied.filter(c => c);
  }

  // Future methods: loadFromCache(), validateSchema(), applyRuntimeOverrides()...
}

export default ConstraintResolver;