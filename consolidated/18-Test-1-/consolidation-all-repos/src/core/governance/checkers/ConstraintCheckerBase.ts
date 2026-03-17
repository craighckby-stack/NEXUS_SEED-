import { TxContext, ConstraintViolation } from '../types';

/**
 * IConstraintChecker defines the interface for specialized constraint checkers.
 * This pattern allows ConstraintEnforcer to register and run specific categories
 * of checks dynamically, decoupled from the core execution loop.
 * 
 * Adheres to the strategic mandate for asynchronous initialization (IAsyncInitializable).
 */
export interface IConstraintChecker {
    /** Identifier for debugging and logging. Should be unique across checkers. */
    checkerId: string;

    /**
     * Initializes the checker. This must be asynchronous.
     * All configuration (e.g., GAXConstraintSet) must be sourced internally
     * via injected Registry Kernels during this process, not passed as arguments.
     */
    initialize(): Promise<void>;

    /**
     * Runs the specific category of checks against the transaction context.
     * @param txContext The context (including metadata and state) of the transaction being checked.
     * @returns A list of violations found. Returns an empty array if no violations exist.
     */
    check(txContext: TxContext): ConstraintViolation[];
}