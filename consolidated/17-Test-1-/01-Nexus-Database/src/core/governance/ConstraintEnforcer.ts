import { GAXConstraintSet, TxContext, ConstraintViolation, ConstraintValidationResult } from './types';
import rawConstraints from '../../../registry/protocol/gax_constraint_set.json';
import { ConstraintValidator } from './ConstraintValidator';

/**
 * Manages, validates, and enforces all system constraints (GAX).
 * Decouples constraint logic from transaction execution flow and provides generalization for checking limits.
 */
export class ConstraintEnforcer {
    private constraints: GAXConstraintSet;

    /**
     * Loads and validates the constraint set upon initialization, ensuring data integrity.
     */
    constructor() {
        // Step 1: Runtime validation of static configuration file structure
        const validationResult: ConstraintValidationResult = ConstraintValidator.validate(rawConstraints);

        if (validationResult.success) {
            // Cast is safe after successful validation
            this.constraints = rawConstraints as GAXConstraintSet;
            console.log(`GAX Constraint Enforcer initialized (v${this.constraints.schema_version})`);
        } else {
            // Prevent startup if core governance definitions are malformed
            throw new Error(`Failed to load GAX Constraints due to validation errors:\n- ${validationResult.errors.join('\n- ')}`);
        }
    }

    /** 
     * Runs the transaction context through all configured constraints. 
     * Returns an array of violations if any constraints are broken, allowing higher layers to handle rejection/warning based on failure mode.
     *
     * @param txContext The standardized transaction context object containing runtime execution metadata.
     * @returns An array of structured ConstraintViolation objects, or null if compliant.
     */
    public checkTransaction(txContext: TxContext): ConstraintViolation[] | null {
        const violations: ConstraintViolation[] = [];

        // Phase 1: Global Execution Limits (Gas, Size, Memory, etc.)
        violations.push(...this._checkGlobalExecutionLimits(txContext));

        // Phase 2: System Integrity/Protocol Specific Limits (e.g., Max State Writes)
        // Future phases can be added here, maintaining a clean pipeline structure.

        return violations.length > 0 ? violations : null;
    }

    /** Retrieves the state of a system governance feature toggle. */
    public getToggle(feature: keyof GAXConstraintSet['system_governance_toggles']): boolean {
        return this.constraints.system_governance_toggles[feature];
    }

    /**
     * Generic utility to check a context value against a defined limit configuration.
     * @private
     */
    private _checkLimit(
        contextValue: number,
        config: { limit: number, failure_mode: 'REJECT' | 'WARN' },
        constraintName: string,
        messageTemplate: (used: number, limit: number) => string,
        details: object = {}
    ): ConstraintViolation | null {
        if (contextValue > config.limit) {
            return {
                constraint: constraintName,
                level: config.failure_mode,
                message: messageTemplate(contextValue, config.limit),
                details: { ...details, used: contextValue, limit: config.limit, action: config.failure_mode }
            };
        }
        return null;
    }

    /**
     * Handles all constraints defined under the 'global_execution_limits' section.
     * @private
     */
    private _checkGlobalExecutionLimits(txContext: TxContext): ConstraintViolation[] {
        const violations: ConstraintViolation[] = [];
        const limits = this.constraints.global_execution_limits;

        // Check 1: Max Gas Units
        const gasUsed = txContext.resources?.gas || 0;
        let violation = this._checkLimit(
            gasUsed,
            limits.max_gas_units_per_tx,
            'MAX_GAS_UNITS',
            (used, limit) => `Tx exceeded max gas limit: ${limit}. Used: ${used}.`
        );
        if (violation) violations.push(violation);

        // Check 2: Max Payload Size
        const payloadSize = txContext.payload_size || 0;
        violation = this._checkLimit(
            payloadSize,
            limits.max_payload_bytes,
            'MAX_PAYLOAD_SIZE',
            (size, limit) => `Tx payload size (${size}B) exceeded limit: ${limit}B.`
        );
        if (violation) violations.push(violation);

        // Check N: Future limits can be added easily here, using the common _checkLimit pattern.

        return violations;
    }
}