/**
 * core/security/IntegrityHaltValidator.js
 *
 * Strict, static utility for validating critical Integrity Halt logs against
 * the defined structural schema *before* cryptographic signing.
 * Failures here mandate an immediate system halt and indicate a core breach
 * in logging/attestation mechanisms.
 */

import { SchemaValidator } from '../utility/SchemaValidator';
import INTEGRITY_HALT_SCHEMA from '../../config/security/integrity_halt_schema.json';
import { SystemLogger } from '../system/SystemLogger';
import { IsolatedFailureReporter } from '../system/IsolatedFailureReporter';

const CLASS_NAME = 'IntegrityHaltValidator';
const LOG_SOURCE = 'IH_VALIDATOR';

// --- Configuration and Dependency Initialization ---

// Critical Check: Ensure the schema definition loaded successfully. If configuration is missing,
// we cannot guarantee validation security and must halt immediately during bootstrap.
if (!INTEGRITY_HALT_SCHEMA || Object.keys(INTEGRITY_HALT_SCHEMA).length === 0) {
    throw new Error(`${CLASS_NAME}: Failed to load necessary Integrity Halt Schema from disk/config path.`);
}

const schemaValidatorInstance = new SchemaValidator(INTEGRITY_HALT_SCHEMA);
const logger = new SystemLogger(LOG_SOURCE);

/**
 * Executes schema validation for high-security integrity logs.
 */
export class IntegrityHaltValidator {

    /** Prevent instantiation, as this is a static utility class. */
    constructor() {
        throw new Error(`${CLASS_NAME} is a static utility class and should not be instantiated.`);
    }

    /**
     * Executes strict validation against the mandated Integrity Halt Schema.
     *
     * @param {object} logPayload - The generated Integrity Halt log object.
     * @returns {void} Throws an error if invalid.
     */
    static validate(logPayload) {
        if (typeof logPayload !== 'object' || logPayload === null) {
            throw new Error(`[${CLASS_NAME} HALT]: Input must be a valid object payload.`);
        }

        const validationResult = schemaValidatorInstance.validate(logPayload);

        if (!validationResult.isValid) {
            const identifier = logPayload.IH_Identifier || 'UNSPECIFIED_ID';

            // Prepare detailed error context for high fidelity logging/reporting
            const errorsDetail = validationResult.errors.map(err => ({
                path: err.instancePath,
                message: err.message
            }));

            const logContext = {
                validation_errors: errorsDetail,
                payload_id: identifier,
                schema_name: INTEGRITY_HALT_SCHEMA.title || 'IntegrityHaltSchema'
            };

            // 1. Log the failure critically.
            logger.critical(`INTEGRITY BREACH: Halt Log (ID: ${identifier}) failed CRITICAL structural validation.`, logContext);

            // 2. Report the failure through the isolated mechanism.
            if (IsolatedFailureReporter && IsolatedFailureReporter.report) {
                IsolatedFailureReporter.report({
                    source: LOG_SOURCE,
                    severity: 'CRITICAL_HALT',
                    message: 'Integrity Halt Log Schema Violation detected.',
                    context: logContext
                });
            }

            // 3. Halt execution immediately.
            throw new Error(`[${CLASS_NAME} HALT] SCHEMA VIOLATION. First Error: ${validationResult.errors[0].message}`);
        }
    }
}