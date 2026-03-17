// Sovereign AGI v95.0 - Systemic Requirement Modulator (SRM)
// Alignment: GSEP Stage 1 (Intent & Scoping)
// Function: Synthesizes aggregated system signals (FBA/SEA/EDP) into a structured, 
// validated M-01 Mutation Intent Request package ready for execution scheduling.

const crypto = require('crypto');
const SystemSignalSynthesizer = require('./SystemSignalSynthesizer');
const SchemaValidator = require('../utility/SchemaValidator'); // New Dependency for high-integrity checks
const Log = require('../utility/AgiLogger');

/**
 * Defines the strict, declarative schema for the M-01 Intent Request.
 * This structure supports programmatic validation via SchemaValidator.
 */
const M01_SCHEMA = {
    // Core Data Fields
    targetComponent: { type: 'string', required: true, minLength: 3 },
    intentType: {
        type: 'enum',
        required: true,
        values: ['Optimization', 'Bugfix', 'Evolution', 'Refactor', 'Scaffold', 'Security', 'Audit']
    },
    priorityScore: {
        type: 'number',
        required: true,
        min: 10, // MIN_PRIORITY
        max: 100, // MAX_PRIORITY
        integer: true
    },
    // Integrity & Metadata Fields
    justification: { type: 'string', required: true },
    justificationHash: { type: 'string', required: true, length: 64 }, // SHA256 length
    signalSources: { type: 'array', required: true, minLength: 1 },
    timestamp: { type: 'number', required: true, min: 1000000000000 }, // Sanity check for epoch time
    sourceModule: { type: 'string', required: true }
};

// Extract constraints from the schema for quick runtime checks
const CONSTRAINTS = {
    MIN_PRIORITY: M01_SCHEMA.priorityScore.min,
    MAX_PRIORITY: M01_SCHEMA.priorityScore.max
};

class SystemicRequirementModulator {
    constructor(synthesizerInstance, validatorInstance) {
        // Decoupled dependencies for better testing and control (Dependency Injection)
        this.synthesizer = synthesizerInstance || new SystemSignalSynthesizer();
        this.validator = validatorInstance || new SchemaValidator();
        this.M01_S = M01_SCHEMA;
        this.C = CONSTRAINTS;
        this.log = new Log('SRM');
    }

    /**
     * Synthesizes complex system signals and generates a high-fidelity M-01 Mutation Intent Request.
     * @param {Object} signals - Aggregated data bundles { fbaData, seaReport, edpSchedule }.
     * @returns {{ success: boolean, M01?: Object, error?: Object }} M-01 Request Package or failure object.
     */
    generateM01(signals) {
        // 1. Synthesize signals to derive the systemic need.
        const criticalNeed = this.synthesizer.synthesize(signals);

        // Fail early if systemic pressure is insufficient.
        const pScore = criticalNeed ? criticalNeed.priorityScore : 0;
        if (pScore < this.C.MIN_PRIORITY) {
            this.log.debug(`Insufficient systemic pressure detected (P:${pScore}).`);
            return { success: false, error: { code: 'P_SCORE_LOW', message: "Systemic pressure score below minimum activation threshold." } };
        }

        // 2. Formulate Mutation Intent structure
        const justificationText = this._generateJustificationText(criticalNeed);

        const M01 = {
            timestamp: Date.now(),
            sourceModule: 'SRM',
            signalSources: criticalNeed.sources,
            intentType: criticalNeed.type, 
            targetComponent: criticalNeed.component,
            // Ensure priority is clamped by definition limits
            priorityScore: Math.min(Math.max(pScore, this.C.MIN_PRIORITY), this.C.MAX_PRIORITY),
            justification: justificationText,
            justificationHash: this._hashJustification(justificationText),
            mutationParams: criticalNeed.mutationParams || {}
        };

        // 3. High-Integrity Validation (Structural + Internal Integrity Check)
        const validationResult = this._validateM01(M01);
        
        if (!validationResult.isValid) {
            // Structured failure required for traceability.
            this.log.error(`Generated M-01 failed primary schema validation for ${M01.targetComponent}.`, { details: validationResult.errors });
            return { 
                success: false, 
                error: { 
                    code: 'M01_VALIDATION_FAILURE', 
                    message: "Generated M-01 failed internal structure and integrity checks.",
                    details: validationResult.errors
                }
            };
        }

        this.log.info(`Generated M-01 (${M01.intentType}) for ${M01.targetComponent}. P:${M01.priorityScore}.`);
        return { success: true, M01 };
    }

    /**
     * Uses object destructuring for clean extraction of needed fields.
     */
    _generateJustificationText({ priorityScore, type, component, sources }) {
        const sourcesStr = sources.join(', ');
        return `SRM Synthesis (P:${priorityScore}): Modulated request type=${type} targeting component=${component}. Origin signals: [${sourcesStr}].`;
    }

    _hashJustification(justification) {
        return crypto.createHash('sha256').update(justification, 'utf8').digest('hex');
    }

    /**
     * Performs strict structural validation using the declarative schema and verifies integrity.
     * Delegates structural checks and performs a final internal integrity hash check.
     * @param {Object} m01 
     * @returns {{ isValid: boolean, errors: string[] }}
     */
    _validateM01(m01) {
        // Step 3a: Structural Validation via Schema
        const validationResult = this.validator.validate(m01, this.M01_S);
        
        if (!validationResult.isValid) {
            return validationResult;
        }

        // Step 3b: Secondary Integrity Check (Hash verification - essential contextual check)
        const computedHash = this._hashJustification(m01.justification);
        if (m01.justificationHash !== computedHash) {
            validationResult.isValid = false;
            validationResult.errors.push(
                `Justification hash failed integrity verification. Expected ${computedHash.substring(0, 8)}..., Got ${m01.justificationHash.substring(0, 8)}...`
            );
        }
        
        return validationResult;
    }
}

module.exports = SystemicRequirementModulator;