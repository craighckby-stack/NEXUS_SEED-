export class ConstraintViolationError extends Error {
  public constraintType: string;
  
  constructor(message: string, constraintType: string) {
    super(`Constraint violation detected: ${message}`);
    this.name = 'ConstraintViolationError';
    this.constraintType = constraintType;
  }
}

export interface ConstraintDefinition {
  type: 'rate_limit' | 'payload_size' | 'timeout' | string; // Use known constraint types for better DX
  value: number | string;
  unit?: string;
  appliesTo: 'service' | 'method' | 'field';
}

// Defines the optimized lookup structure: Map<"serviceName/methodName", ConstraintDefinition[]>
export type IndexedConstraintMap = Map<string, ConstraintDefinition[]>; 

export class GaxConstraintEnforcer {
  // The enforcer relies on a pre-indexed, strongly typed constraint map.
  private indexedConstraints: IndexedConstraintMap;

  /**
   * Initializes the enforcer with a pre-indexed map of constraints.
   * Indexing logic (inheritance, merging) must occur externally.
   */
  constructor(indexedConstraints: IndexedConstraintMap) {
    this.indexedConstraints = indexedConstraints;
  }

  /**
   * Retrieves and enforces all relevant constraints for a specific API call.
   */
  public enforce(serviceName: string, methodName: string, request: unknown): void {
    const constraints = this.getEffectiveConstraints(serviceName, methodName);

    if (constraints.length === 0) {
      return; 
    }

    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'rate_limit':
          // Implementation requires integrating a stateful rate limiter utility.
          if (!this.checkRateLimit(serviceName, methodName)) {
            throw new ConstraintViolationError('Rate limit exceeded for method call', constraint.type);
          }
          break;
        case 'payload_size':
          const limit = constraint.value as number;
          if (this.checkPayloadSize(request, limit, constraint.unit)) {
             throw new ConstraintViolationError(`Payload size (${limit} ${constraint.unit || 'bytes'}) exceeded limit`, constraint.type);
          }
          break;
        // Further validation cases (e.g., 'timeout', 'field_pattern') can be added here.
        default:
          console.warn(`[GaxConstraintEnforcer] Skipping unknown constraint type: ${constraint.type}`);
      }
    }
  }

  /**
   * Calculates the effective constraints. O(1) lookup since constraints are pre-indexed by method.
   */
  private getEffectiveConstraints(serviceName: string, methodName: string): ConstraintDefinition[] {
    const key = `${serviceName}/${methodName}`;
    return this.indexedConstraints.get(key) || [];
  }

  // --- Stub Implementations for Runtime Checks ---

  private checkRateLimit(serviceName: string, methodName: string): boolean {
    // TRUE if the call is allowed.
    // Requires external RateLimiter instance injection.
    return true; 
  }
  
  private checkPayloadSize(request: unknown, limit: number, unit?: string): boolean {
    // TRUE if the request violates the size limit.
    try {
      const bytes = Buffer.byteLength(JSON.stringify(request), 'utf8');
      // TODO: Add unit conversion logic (KB, MB, GB)
      return bytes > limit; 
    } catch (e) {
      // Handle serialization errors gracefully
      return true; // Assume violation if size cannot be determined safely
    }
  }
}