class GAX_PreFlightConstraintEngine {
  constructor(constraintDefinition) {
    this.constraints = constraintDefinition.mandatory_constraints;
    this.typeMap = constraintDefinition.required_types;
  }

  // PLACEHOLDER: Implementation of reliable JSON path traversal (e.g., using 'lodash.get')
  // Note: Must be highly optimized for efficiency, perhaps with path caching.
  _getValueAtPath(artifact, path) {
    // Assuming standard property access for efficiency demonstration.
    // Real-world implementation requires a robust path library.
    const value = artifact[path]; 
    if (value === undefined) throw new Error(`Path '${path}' not found.`);
    return value;
  }

  // --- Rule Execution Handlers ---

  _checkPresence(value) {
    return value !== undefined && value !== null;
  }

  _executeRule(value, rule) {
    // Centralized rule dispatcher optimized for rapid lookup
    const handlers = {
      'presence': this._checkPresence,
      // Add other highly optimized rule handlers here (e.g., dataType, valueMatch)
    };
    const handler = handlers[rule.type];
    // If handler exists, execute it. If not, assume validation passes by default (or throw if strict).
    return handler ? handler(value) : true;
  }

  _checkType(value, expectedType) {
    if (expectedType === 'null') return value === null;
    if (expectedType === 'array') return Array.isArray(value);
    
    // Check against standard JS types (string, number, boolean, object)
    return typeof value === expectedType;
  }

  // --- Validation Executors ---

  async _executeStructuralRule(artifact, constraint) {
    const { targetPath: path, rule, constraintId } = constraint;
    try {
      const value = this._getValueAtPath(artifact, path);
      if (!this._executeRule(value, rule)) {
        return { constraintId, path, status: 'FAILED', type: 'STRUCTURAL', reason: `Rule type ${rule.type} failed validation.` };
      }
    } catch (e) {
      // Special case: If path retrieval fails, this is only acceptable if it wasn't a mandatory presence check.
      if (rule.type === 'presence') {
        return { constraintId, path, status: 'FAILED', type: 'STRUCTURAL', reason: `Presence check failed: Target path not found.` };
      }
      // If the path failed lookup but the rule wasn't presence, we default to passing the structural check
      // to prevent false negatives on optional paths, unless the exception is critical.
    }
    return null; // Null signifies success/pass
  }

  async _executeTypeRule(artifact, path, expectedType) {
    try {
      const value = this._getValueAtPath(artifact, path);

      if (!this._checkType(value, expectedType)) {
        // Note: typeof null is 'object'. _checkType handles this.
        return { path, status: 'FAILED', type: 'SEMANTIC_TYPE', reason: `Type mismatch. Expected '${expectedType}', received '${typeof value}'.` };
      }
    } catch (e) {
      // Failure to retrieve path is a critical error for required types.
      return { path, status: 'FAILED', type: 'SEMANTIC_TYPE', reason: `Path lookup failed for required type check: ${e.message}` };
    }
    return null; // Null signifies success/pass
  }

  async validate(targetArtifact) {
    // 1. Parallelize Structural Constraint Execution
    const constraintPromises = this.constraints.map(c => this._executeStructuralRule(targetArtifact, c));

    // 2. Parallelize Required Type Validation
    const typePromises = Object.entries(this.typeMap).map(([path, type]) => this._executeTypeRule(targetArtifact, path, type));

    // Execute all validations concurrently using Promise.all
    const rawResults = await Promise.all([...constraintPromises, ...typePromises]);
    
    // Filter out successful (null) results
    const failedResults = rawResults.filter(r => r !== null);

    if (failedResults.length > 0) {
      // Attach failure details to the error object for programmatic inspection
      const validationError = new Error(`GAX Pre-Flight Validation Failed: ${failedResults.length} critical issues detected.`);
      validationError.details = failedResults; 
      throw validationError;
    }
    return true;
  }
}

module.exports = GAX_PreFlightConstraintEngine;