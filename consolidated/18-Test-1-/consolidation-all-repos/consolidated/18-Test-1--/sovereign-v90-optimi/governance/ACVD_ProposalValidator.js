import acvdSchema from './ACVD_schema.json';
import logger from '../utility/logger.js';
import StrictSchemaValidator from 'AGI_PLUGIN/StrictSchemaValidator';

// --- AGI Plugin Integration: SchemaErrorAnalyzer ---
// Defines the interface for the externally managed error analysis tool
interface IErrorAnalyzer {
    analyze: (errors: any[]) => { summary: any[], counts: { [key: string]: number }, severityCounts: { [key: string]: number } };
}


class ACVDProposalValidator {
    #acvdValidator: StrictSchemaValidator;
    #errorAnalyzer: IErrorAnalyzer;
    #logger = logger;
    #schemaDefinition = acvdSchema;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Handles synchronous resolution and initialization of external dependencies.
     */
    #setupDependencies() {
        // 1. Dependency Resolution: errorAnalyzer (Simulated DI/Global lookup)
        this.#errorAnalyzer = this.#delegateToErrorAnalyzerResolution();

        // 2. Dependency Resolution: StrictSchemaValidator (Synchronous Initialization)
        this.#acvdValidator = new StrictSchemaValidator(this.#schemaDefinition, 'ACVD Proposal Validator');

        // 3. Post-Setup Logging
        this.#delegateToInitializationLogging();
    }

    /**
     * Validates an AGI-generated code evolution proposal against the ACVD governance schema.
     */
    validateProposal(proposal: object) {
        const proposalId = (proposal as any)?.proposalId || 'N/A';

        // Use the StrictSchemaValidator plugin via proxy for robust validation
        const { isValid, rawErrors, initErrorDetails } = this.#delegateToValidationExecution(proposal);

        // Handle System Initialization Failure path (CRITICAL architectural error)
        if (initErrorDetails) {
            this.#logError(`Validator uninitialized due to schema error. Rejecting proposal ID ${proposalId}. Context stored in initErrorDetails.`);
            
            // Format structured failure context
            const failureSummary = this.#formatInitializationFailure(initErrorDetails);

            return {
                isValid: false,
                rawErrors: [initErrorDetails],
                errorSummary: failureSummary,
                errorCounts: { system_init_failure: 1 },
                errorSeverityCounts: { CRITICAL: 1, MAJOR: 0, MINOR: 0 }
            };
        }

        if (!isValid) {
            // Use the SchemaErrorAnalyzer plugin via proxy for structured analysis
            const { summary, counts, severityCounts } = this.#delegateToErrorAnalysis(rawErrors!);
            
            // Determine log level based on detected severity
            const logLevel: 'warn' | 'error' = severityCounts.CRITICAL > 0 ? 'error' : 'warn';

            // Enhanced structured logging via proxy
            this.#logValidationFailure(logLevel, proposalId, summary, counts, severityCounts);

            return {
                isValid: false,
                rawErrors: rawErrors,
                errorSummary: summary, 
                errorCounts: counts,
                errorSeverityCounts: severityCounts
            };
        }
        
        this.#logInfo(`ACVD Proposal ${proposalId} validated successfully.`);
        return {
            isValid: true,
            rawErrors: null,
            errorSummary: null,
            errorCounts: null,
            errorSeverityCounts: null
        };
    }

    // --- I/O Proxy Methods (External Dependency Isolation) ---

    #delegateToErrorAnalyzerResolution(): IErrorAnalyzer {
        return (globalThis as any).SchemaErrorAnalyzer || {
            analyze: (errors) => { 
                return { summary: [], counts: {}, severityCounts: { CRITICAL: 0, MAJOR: 0, MINOR: 0 } };
            }
        };
    }

    #delegateToValidationExecution(proposal: object) {
        return this.#acvdValidator.validate(proposal);
    }

    #delegateToErrorAnalysis(rawErrors: any[]) {
        return this.#errorAnalyzer.analyze(rawErrors);
    }

    #delegateToInitializationLogging() {
        if (!this.#acvdValidator.isInitialized) {
            const details = this.#acvdValidator.getInitErrorDetails();
            this.#logFatal('ACVD Validator Initialization FAILED: Schema compilation error.', details);
        } else {
            this.#logInfo('ACVD Proposal Validator schema compiled successfully. (Strict compliance and robust error collection enabled)');
        }
    }

    #logFatal(message: string, details: any) {
        this.#logger.fatal(message, details);
    }

    #logInfo(message: string) {
        this.#logger.info(message);
    }

    #logError(message: string, context?: object) {
        this.#logger.error(message, context);
    }

    #logWarn(message: string, context?: object) {
        this.#logger.warn(message, context);
    }

    #logValidationFailure(logLevel: 'warn' | 'error', proposalId: string, summary: any[], counts: object, severityCounts: object) {
        const message = `ACVD Proposal Validation Failed: ${summary.length} errors found (${(severityCounts as any).CRITICAL} CRITICAL). Proposal ID: ${proposalId}`;
        const context = {
            errorCounts: counts, 
            errorSummary: summary, 
            errorSeverityCounts: severityCounts
        };
        
        if (logLevel === 'error') {
            this.#logError(message, context);
        } else {
            this.#logWarn(message, context);
        }
    }

    #formatInitializationFailure(initErrorDetails: any) {
        return [{
            dataPath: '',
            keyword: initErrorDetails.keyword,
            message: initErrorDetails.message,
            params: { context: initErrorDetails.errorContext },
            severity: 'CRITICAL'
        }];
    }
}


// Instantiate the singleton validator instance
const validatorInstance = new ACVDProposalValidator();

/**
 * Public export maintaining the original module interface.
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, rawErrors: array|null, errorSummary: array|null, errorCounts: object|null, errorSeverityCounts: object|null}} The validation result.
 */
export function validateProposal(proposal: object) {
    return validatorInstance.validateProposal(proposal);
}