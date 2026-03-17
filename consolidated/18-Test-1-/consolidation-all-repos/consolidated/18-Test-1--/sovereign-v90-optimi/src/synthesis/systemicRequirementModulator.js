// Sovereign AGI v95.0 - Systemic Requirement Modulator (SRM)
// Alignment: GSEP Stage 1 (Intent & Scoping)
// Function: Synthesizes aggregated system signals (FBA/SEA/EDP) into a structured, 
// validated M-01 Mutation Intent Request package ready for execution scheduling.

import { SystemSignalSynthesizer } from './SystemSignalSynthesizer';
import { SchemaValidator } from '../utility/SchemaValidator'; // Dependency for high-integrity checks
import { Log } from '../utility/AgiLogger';

/**
 * Interface for the SHA256 hashing utility.
 * The implementation is provided by the SHA256Hasher plugin.
 */
interface IHasher {
    execute(data: string): string;
}

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

/**
 * Synthesizes system signals into a validated, high-integrity M-01 Mutation Intent Request.
 */
export class SystemicRequirementModulator {
    private synthesizer: SystemSignalSynthesizer;
    private validator: SchemaValidator;
    private hasher: IHasher; // Injected dependency
    private M01_S: typeof M01_SCHEMA;
    private C: typeof CONSTRAINTS;
    private log: Log;

    /**
     * @param synthesizerInstance The signal synthesis service.
     * @param validatorInstance The schema validation utility.
     * @param hasherInstance The SHA256 hashing utility (Injected via AGI Kernel).
     */
    constructor(
        synthesizerInstance: SystemSignalSynthesizer,
        validatorInstance: SchemaValidator,
        hasherInstance: IHasher
    ) {
        // Decoupled dependencies for better testing and control (Dependency Injection)
        this.synthesizer = synthesizerInstance;
        this.validator = validatorInstance;
        this.hasher = hasherInstance;
        this.M01_S = M01_SCHEMA;
        this.C = CONSTRAINTS;
        this.log = new Log('SRM');
    }

    /**
     * Synthesizes complex system signals and generates a high-fidelity M-01 Mutation Intent Request.
     * @param signals - Aggregated data bundles { fbaData, seaReport, edpSchedule }.
     * @returns {{ success: boolean, M01?: Object, error?: Object }} M-01 Request Package or failure object.
     */
    public generateM01(signals: any): { success: boolean, M01?: any, error?: any } {
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
        const justificationHash = this.hasher.execute(justificationText); // Use injected hasher

        const M01 = {
            timestamp: Date.now(),
            sourceModule: 'SRM',
            signalSources: criticalNeed.sources,
            intentType: criticalNeed.type, 
            targetComponent: criticalNeed.component,
            // Ensure priority is clamped by definition limits
            priorityScore: Math.min(Math.max(pScore, this.C.MIN_PRIORITY), this.C.MAX_PRIORITY),
            justification: justificationText,
            justificationHash: justificationHash,
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
    private _generateJustificationText({ priorityScore, type, component, sources }: any): string {
        const sourcesStr = sources.join(', ');
        return `SRM Synthesis (P:${priorityScore}): Modulated request type=${type} targeting component=${component}. Origin signals: [${sourcesStr}].`;
    }

    /**
     * Performs strict structural validation using the declarative schema and verifies integrity.
     * Delegates structural checks and performs a final internal integrity hash check.
     * @param m01 
     * @returns {{ isValid: boolean, errors: string[] }}
     */
    private _validateM01(m01: any): { isValid: boolean, errors: string[] } {
        // Step 3a: Structural Validation via Schema
        const validationResult = this.validator.validate(m01, this.M01_S);
        
        if (!validationResult.isValid) {
            return validationResult;
        }

        // Step 3b: Secondary Integrity Check (Hash verification - essential contextual check)
        // Use the injected hasher plugin
        const computedHash = this.hasher.execute(m01.justification);
        if (m01.justificationHash !== computedHash) {
            validationResult.isValid = false;
            validationResult.errors.push(
                `Justification hash failed integrity verification. Expected ${computedHash.substring(0, 8)}..., Got ${m01.justificationHash.substring(0, 8)}...`
            );
        }
        
        return validationResult;
    }
}

// Module export for Node environments (if using CommonJS style import)
// module.exports = SystemicRequirementModulator; // Removed module.exports for standard TS/ESM export approach