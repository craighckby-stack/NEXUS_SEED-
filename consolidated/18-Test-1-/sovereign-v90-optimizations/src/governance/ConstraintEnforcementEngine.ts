import { ILoggerToolKernel } from 'AGI-Kernel/tools';
import { IKernel } from 'AGI-Kernel/types';

/**
 * Represents a constraint violation with details about the failed constraint.
 */
export interface ConstraintViolation {
    /** The name of the constraint that was violated */
    constraintName: string;
    /** Human-readable description of the violation */
    message: string;
    /** Additional context about the violation */
    details?: unknown;
}

/**
 * A function that evaluates a subject against a constraint and returns a violation if the constraint is not met.
 */
export type Constraint<T> = (subject: T) => ConstraintViolation | null;

/**
 * Interface for the constraint evaluator tool kernel.
 */
export interface IConstraintEvaluatorToolKernel<T> {
    /** Evaluates all constraints against a subject */
    evaluate(constraints: Map<string, Constraint<T>>, subject: T): Promise<ConstraintViolation[]>;
}

/**
 * Enforces constraints on subjects using an injected evaluator for asynchronous rule checking.
 */
export class ConstraintEnforcementKernel<T> implements IKernel {
    private readonly constraints: Map<string, Constraint<T>> = new Map();
    private readonly logger: ILoggerToolKernel;
    private readonly evaluator: IConstraintEvaluatorToolKernel<T>;

    /**
     * Creates a new ConstraintEnforcementKernel instance.
     * @param dependencies - Required dependencies for the kernel
     * @param dependencies.logger - Kernel-compliant logger utility
     * @param dependencies.evaluator - Kernel responsible for executing constraint evaluations asynchronously
     */
    constructor(
        dependencies: {
            logger: ILoggerToolKernel;
            evaluator: IConstraintEvaluatorToolKernel<T>;
        }
    ) {
        this.logger = dependencies.logger;
        this.evaluator = dependencies.evaluator;

        this.#validateDependencies();
    }

    /**
     * Validates that all required dependencies are present and properly initialized.
     */
    #validateDependencies(): void {
        if (!this.logger || typeof this.logger.warn !== 'function') {
            throw new Error("ConstraintEnforcementKernel requires a valid ILoggerToolKernel.");
        }
        if (!this.evaluator || typeof this.evaluator.evaluate !== 'function') {
            throw new Error("ConstraintEnforcementKernel requires a valid IConstraintEvaluatorToolKernel.");
        }
    }

    /**
     * Asynchronous initialization phase.
     */
    async initialize(): Promise<void> {
        // Future implementation for async configuration loading or setup.
    }

    /**
     * Registers a new constraint function.
     * @param name - The unique name of the constraint
     * @param constraint - The function that evaluates the subject and returns a violation or null
     */
    registerConstraint(name: string, constraint: Constraint<T>): void {
        if (this.constraints.has(name)) {
            this.logger.warn(`Constraint "${name}" was overwritten.`);
        }
        this.constraints.set(name, constraint);
    }

    /**
     * Checks the subject against all registered constraints using the abstracted
     * asynchronous evaluation logic (delegated to the injected evaluator).
     * @param subject - The data/state to validate
     * @returns A promise resolving to an array of violations, or an empty array if compliant
     */
    async enforce(subject: T): Promise<ConstraintViolation[]> {
        this.logger.debug("Starting constraint enforcement.");
        
        const violations = await this.evaluator.evaluate(this.constraints, subject);

        if (violations.length > 0) {
            this.logger.error(
                `Constraint Enforcement Failed: Detected ${violations.length} violations.`,
                { 
                    violationCount: violations.length, 
                    violations: violations.map(v => v.constraintName) 
                }
            );
        }

        return violations;
    }
}
