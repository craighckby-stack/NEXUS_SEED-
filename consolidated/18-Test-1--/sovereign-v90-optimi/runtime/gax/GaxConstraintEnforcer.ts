declare const PayloadSizeChecker: { execute: (args: { request: unknown, limit: number, unit?: string }) => boolean; };

// --- Constraint Definitions ---
export class ConstraintViolationError extends Error {
 public readonly constraintType: string;

 constructor(message: string, constraintType: string) {
 super(`Constraint violation detected: ${ message }`);
 this.name = 'ConstraintViolationError';
 this.constraintType = constraintType;
 }
}

export interface ConstraintDefinition {
 type: 'rate_limit' | 'payload_size' | 'timeout' | string;
 value: number | string;
 unit?: string;
 appliesTo: 'service' | 'method' | 'field';
}

export type IndexedConstraintMap = Map < string, ConstraintDefinition[]>;

// --- Plugin Interface Definitions ---

export interface ConstraintCheckResult {
 isViolated: boolean;
 violationMessage?: string;
}

export interface IConstraintChecker {
 readonly constraintType: string;
 execute(constraint: ConstraintDefinition, request: unknown): ConstraintCheckResult;
}

// --- Gax Constraint Enforcer Kernel ---

export class GaxConstraintEnforcerKernel {
 #indexedConstraints: IndexedConstraintMap;
 #checkers: Map < string, IConstraintChecker>;

 constructor(indexedConstraints: IndexedConstraintMap, checkers: IConstraintChecker[]) {
 this.#setupDependencies(indexedConstraints, checkers);
 }

 #setupDependencies(indexedConstraints: IndexedConstraintMap, checkers: IConstraintChecker[]): void {
 if (!indexedConstraints || !checkers) {
 throw new Error("[GaxConstraintEnforcerKernel Setup Error] Indexed constraints and checkers list must be provided.");
 }
 this.#indexedConstraints = indexedConstraints;

 const checkerMap = new Map < string, IConstraintChecker>();
 for (const checker of checkers) {
 if (!checker?.constraintType) {
 throw new Error("[GaxConstraintEnforcerKernel Setup Error] Invalid checker provided; must implement IConstraintChecker.");
 }
 checkerMap.set(checker.constraintType, checker);
 }
 this.#checkers = checkerMap;
 }

 public enforce(serviceName: string, methodName: string, request: unknown): void {
 const constraints = this.#indexedConstraints.get(`${serviceName}/${methodName}`) || [];

 for (const constraint of constraints) {
 const checker = this.#checkers.get(constraint.type);

 if (!checker) {
 console.warn(`[GaxConstraintEnforcerKernel] Skipping constraint '${constraint.type}'. No checker registered.`);
 continue;
 }

 const result = checker.execute(constraint, request);

 if (result.isViolated) {
 const message = result.violationMessage || `Constraint violation of type '${constraint.type}' detected.`;
 throw new ConstraintViolationError(message, constraint.type);
 }
 }
 }
}
