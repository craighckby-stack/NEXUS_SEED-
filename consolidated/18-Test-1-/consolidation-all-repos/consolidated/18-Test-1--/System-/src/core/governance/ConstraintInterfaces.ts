import { TxContext, GAXConstraintSet, ConstraintViolation } from './types';

/**
 * IConstraintChecker defines the interface for specialized constraint checkers.
 * This pattern allows ConstraintEnforcer to register and run specific categories
 * of checks dynamically, decoupled from the core execution loop.
 */
export interface IConstraintChecker {
    // Initializes the checker with relevant parts of the GAX constraint set
    initialize(constraints: GAXConstraintSet): void;

    // Runs the specific category of checks against the transaction context
    check(txContext: TxContext): ConstraintViolation[];

    // Identifier for debugging and logging
    checkerId: string;
}
