import { GAXConstraintSet, ConstraintValidationResult } from './types';

/**
 * Utility class responsible for runtime validation of the GAX Constraint Set structure.
 * Ensures static governance configuration files adhere to the expected schema.
 */
export class ConstraintValidator {

    /**
     * Checks the raw input data against the expected GAXConstraintSet structure.
     * NOTE: In a production environment, a library like Zod or Yup would define the schema rigorously.
     */
    public static validate(rawConstraints: any): ConstraintValidationResult {
        const errors: string[] = [];

        if (!rawConstraints || typeof rawConstraints !== 'object') {
            return { success: false, errors: ['Input is not a valid object.'] };
        }

        // Basic mandatory checks
        if (typeof rawConstraints.schema_version !== 'number') {
            errors.push('Missing or invalid schema_version (expected number).');
        }

        if (!rawConstraints.global_execution_limits) {
            errors.push('Missing core global_execution_limits definition.');
        } else {
            // Check for critical sub-keys
            const gasLimit = rawConstraints.global_execution_limits.max_gas_units_per_tx;
            if (!gasLimit || typeof gasLimit.limit !== 'number' || !gasLimit.failure_mode) {
                errors.push('Missing or malformed global_execution_limits.max_gas_units_per_tx.');
            }
        }

        if (!rawConstraints.system_governance_toggles || typeof rawConstraints.system_governance_toggles !== 'object') {
             errors.push('Missing or invalid system_governance_toggles.');
        }

        if (errors.length > 0) {
            return { success: false, errors };
        }

        return { success: true, errors: [] };
    }
}