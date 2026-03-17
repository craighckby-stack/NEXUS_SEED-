/**
 * Custom error class for reporting path resolution failures.
 * Improves internal error handling and differentiation (AGI Goal: Error Handling)
 */
class PathResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PathResolutionError";
  }
}

/**
 * Constants for standardized rule types (AGI Goal: Refactoring/Abstraction)
 */
const RuleTypes = {
  PRESENCE: 'presence',
  DATA_TYPE: 'dataType',
  VALUE_MATCH: 'valueMatch',
};

// Define an interface for the expected plugin behavior for local clarity (TS only)
interface IJsonPathResolver {
    execute(args: { artifact: any, path: string }): any;
}

// Global hook placeholder for the plugin access (simulating environment injection)
declare const JsonPathResolver: IJsonPathResolver;

// Define interface and global hook for the new type checking plugin
interface IDataTypeChecker {
    checkType(value: any, expectedType: string): boolean;
}
declare const DataTypeChecker: IDataTypeChecker;


class GAX_PreFlightConstraintEngine {
  constructor(constraintDefinition: { mandatory_constraints: any[], required_types: Record<string, string> }) {
    this.#initializeEngine(constraintDefinition);
  }
  
  private constraints: any[];
  private typeMap: Record<string, string>;

  /**
   * Extracts synchronous initialization and dependency validation.
   */
  #initializeEngine(constraintDefinition: { mandatory_constraints: any[], required_types: Record<string, string> }): void {
    this.constraints = constraintDefinition.mandatory_constraints;
    this.typeMap = constraintDefinition.required_types;
    // Ensure the required type checker is available
    if (typeof DataTypeChecker === 'undefined') {
        throw new Error("Dependency Injection Error: DataTypeChecker plugin is required.");
    }
  }

  // --- I/O Proxy Methods ---

  /**
   * Private proxy to delegate artifact path resolution to the external tool.
   */
  #delegateToJsonPathResolverExecution(artifact: object, path: string): any {
    // @ts-ignore: Assume global presence of JsonPathResolver injected by runtime.
    return JsonPathResolver.execute({ artifact, path });
  }

  /**
   * Private proxy to delegate type checking to the external tool.
   */
  #delegateToDataTypeChecker(value: any, expectedType: string): boolean {
    // @ts-ignore: Assume global presence
    return DataTypeChecker.checkType(value, expectedType);
  }

  // --- Internal Logic Methods ---

  /**
   * Executes a defined validation rule against a given value.
   * @param {*} value The value extracted from the artifact.
   * @param {object} rule The rule definition (type, expected, required, etc.).
   * @returns {boolean}
   */
  #executeRule(value: any, rule: any): boolean {
    const isDefined = value !== undefined && value !== null;

    if (rule.type === RuleTypes.PRESENCE) {
      // Assumes rule.required is a boolean flag for structural necessity
      return rule.required ? isDefined : true;
    }
    
    // If the value is not defined and we are not checking for type, the validation passes 
    // (as it's implicitly optional if PRESENCE isn't enforced).
    if (!isDefined && rule.type !== RuleTypes.DATA_TYPE) {
        return true;
    }

    if (rule.type === RuleTypes.DATA_TYPE) {
      const expectedType = rule.expected;
      return this.#delegateToDataTypeChecker(value, expectedType);
    }
    
    if (rule.type === RuleTypes.VALUE_MATCH) {
        return isDefined && value === rule.expectedValue; 
    }
    
    // Default: unknown rule type passes validation
    return true;
  }

  /**
   * Accessor for reliable JSON path traversal, leveraging the external JsonPathResolver plugin.
   * Throws PathResolutionError if any part of the path is missing or undefined/null.
   * @param {object} artifact The data structure to traverse.
   * @param {string} path Dot-notation path (e.g., 'data.user.id').
   * @returns {*} The value at the path.
   */
  #getValueAtPath(artifact: object, path: string): any {
    // AGI-KERNEL Plugin integration: Replace internal logic with external tool call.
    if (!path || !artifact) return undefined;
    
    try {
        return this.#delegateToJsonPathResolverExecution(artifact, path);
    } catch (e: any) {
        // Ensure that any error thrown by the plugin which is a resolution failure 
        // is re-thrown as the locally defined PathResolutionError, allowing `instanceof` checks 
        // in the `validate` method to function correctly across module boundaries.
        if (e.name === "PathResolutionError") {
            throw new PathResolutionError(e.message);
        }
        throw e;
    }
  }

  async validate(targetArtifact: object): Promise<boolean> {
    const results: any[] = [];
    
    // Helper function to capture validation failures consistently (AGI Goal: Refactoring)
    const recordFailure = (constraintId: string | null, path: string, reason: string, type: string = 'FAILED') => {
        const failure: any = { path, status: type, reason };
        if (constraintId) failure.constraint = constraintId;
        results.push(failure);
    };

    // 1. Mandatory Constraint Execution (Structural and Value Rules)
    for (const constraint of this.constraints) {
      const { targetPath: path, rule, constraintId } = constraint;
      let value: any = undefined;

      try {
        value = this.#getValueAtPath(targetArtifact, path);
        
        // Execute rule on found value (including undefined/null if applicable)
        const isValid = this.#executeRule(value, rule);
        
        if (!isValid) {
          recordFailure(constraintId, path, `Rule type ${rule.type} failed validation. Expected: ${rule.expected || rule.expectedValue || 'N/A'}`);
        }

      } catch (e) {
        if (e instanceof PathResolutionError) {
            // Path not found. This only fails validation if a mandatory presence rule is defined.
            if (rule.type === RuleTypes.PRESENCE && rule.required === true) {
                 // Crucial structural failure: Path must exist, but doesn't.
                 recordFailure(constraintId, path, `Mandatory field is missing or path structure is invalid: ${(e as Error).message}`);
            }
            // Otherwise, if path resolution fails for a non-mandatory field, we treat it as skipped (passes).
            
        } else {
            // Unexpected structural errors (e.g., trying to index a primitive)
            recordFailure(constraintId, path, `Internal path resolution failure: ${(e as Error).message}`, 'ERROR');
        }
      }
    }

    // 2. Required Type Validation (Semantic)
    for (const [path, expectedType] of Object.entries(this.typeMap)) {
      try {
        const value = this.#getValueAtPath(targetArtifact, path);
        
        const typeOK = this.#delegateToDataTypeChecker(value, expectedType);
            
        if (!typeOK) {
            // Determine actual type for better reporting
            let actualType: string;
            if (value === null) actualType = 'null';
            else if (value === undefined) actualType = 'undefined/missing'; 
            else actualType = Array.isArray(value) ? 'array' : typeof value;
            
            recordFailure(null, path, `Required type validation failed. Expected '${expectedType}', got '${actualType}'.`);
        }

      } catch (e) {
        if (e instanceof PathResolutionError) {
             // If PathNotFound occurs for a type check defined in typeMap, it's always a failure.
             recordFailure(null, path, `Required path for type check was not found in artifact: ${(e as Error).message}`);
        } else {
             recordFailure(null, path, `Type validation error: ${(e as Error).message}`, 'ERROR');
        }
      }
    }

    if (results.length > 0) {
      // Throw an error with the structured results array attached for robust downstream processing
      const error: any = new Error(`GAX Pre-Flight Validation Failed: ${results.length} critical issues detected.`);
      error.results = results; 
      throw error;
    }
    return true;
  }
}

// @ts-ignore: Required for module system compatibility
module.exports = GAX_PreFlightConstraintEngine;