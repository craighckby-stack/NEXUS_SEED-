const PreconditionExecutorUtility = globalThis.AGI_TOOLS?.PreconditionExecutorUtility;
const FALLBACK_LOGGER = globalThis.AGI_TOOLS?.StructuralLogFormatterUtility;

/**
 * TaskSchedulerValidatorEngine
 * Ensures task definitions conform to the GTCM_CoreDefinitionSchema and meet runtime preconditions.
 */
class TaskSchedulerValidatorEngine {
    // Standardized prefix for setup failures, enhancing traceability.
    static #SETUP_ERROR_PREFIX = '[TaskValidator Setup]';

    #logger;
    #executorUtility;
    #validationChecks;

    /**
     * Extracts the dependency resolution and critical interface validation logic for the Precondition Executor.
     * @param {object | undefined} executorInstance 
     * @returns {object} The validated or newly instantiated utility.
     */
    #getValidatedExecutorUtility(executorInstance) {
        if (!PreconditionExecutorUtility && !executorInstance) {
             throw new Error(`${TaskSchedulerValidatorEngine.#SETUP_ERROR_PREFIX} Required dependency 'PreconditionExecutorUtility' not available.`);
        }
        return executorInstance || new PreconditionExecutorUtility();
    }

    /**
     * Resolves the logger dependency, providing a fallback console logger if needed.
     * @param {object | undefined} inputLogger 
     * @returns {object} The resolved logger instance.
     */
    #resolveLogger(inputLogger) {
        return inputLogger || (FALLBACK_LOGGER ? new FALLBACK_LOGGER('TaskValidator') : console);
    }

    /**
     * @param {object} [dependencies]
     * @param {object} [dependencies.logger] - An instance of the system logger.
     * @param {object} [dependencies.executorUtility] - An instance of PreconditionExecutorUtility.
     */
    constructor({ logger, executorUtility } = {}) {
        // 1. Dependency Resolution using extracted helpers
        this.#executorUtility = this.#getValidatedExecutorUtility(executorUtility);
        this.#logger = this.#resolveLogger(logger);

        // 2. Initialize the Validation Map and freeze it to guarantee immutability.
        this.#validationChecks = Object.freeze(this.#setupValidationMap());
        this.#logger.debug?.("Task validation engine initialized with immutable constraints.");
    }

    /**
     * Defines the canonical set of validation checks for GTCM tasks.
     * This method is private and used only during initialization.
     * @returns {Object<string, {preconditions: string[], check: Function}>}
     */
    #setupValidationMap() {
        return {
            'SCHEMA_CONFORMITY': {
                preconditions: ['SCHEMA_DEFINITION_LOADED', 'DATA_TYPE_VALIDATION'],
                check: (task) => {
                    // Must implement concrete schema validation logic here...
                    return task && typeof task.id === 'string' && typeof task.priority === 'number';
                }
            },
            'CONTEXT_AVAILABILITY': {
                preconditions: ['SYSTEM_STATE_ALIVE', 'RESOURCE_ALLOCATION_CHECK'],
                check: (task) => {
                    // Must ensure execution context parameters are sound.
                    return task.contextId !== null && task.targetSystem !== undefined;
                }
            }
            // ... additional core checks ...
        };
    }
    
    /**
     * Delegates the precondition checks to the external utility, handling immediate errors and logging.
     * This acts as an I/O proxy for the PreconditionExecutorUtility.
     * @param {string[]} preconditions
     * @param {Object} taskDefinition
     * @param {string} checkName
     * @returns {boolean} True if preconditions passed.
     */
    #runPreconditions(preconditions, taskDefinition, checkName) {
        try {
            this.#executorUtility.execute(preconditions, taskDefinition);
            return true;
        } catch (error) {
            this.#logger.warn(`[Validation Precondition Failure] Check: ${checkName}. Error: ${error.message}`);
            return false;
        }
    }

    /**
     * Executes the comprehensive validation suite against a task definition.
     * @param {Object} taskDefinition - The definition compliant with GTCM_CoreDefinitionSchema.
     * @returns {boolean} True if validation passes all checks, false otherwise.
     */
    validate(taskDefinition) {
        if (!taskDefinition || typeof taskDefinition !== 'object') {
            this.#logger.error("Invalid or null task definition provided. Aborting validation.");
            return false;
        }

        let overallValidity = true;

        for (const [checkName, checkConfig] of Object.entries(this.#validationChecks)) {
            const { preconditions, check } = checkConfig;

            // 1. Execute Preconditions using the encapsulated I/O proxy
            const preConditionPass = this.#runPreconditions(preconditions, taskDefinition, checkName);

            if (!preConditionPass) {
                overallValidity = false;
                continue; // Skip core check if preconditions fail
            }

            // 2. Execute Core Check
            try {
                if (!check(taskDefinition)) {
                    this.#logger.error(`[Validation Core Failure] Check failed: ${checkName}`);
                    overallValidity = false;
                }
            } catch (error) {
                this.#logger.fatal(`[Validation Execution Error] Check ${checkName} threw exception: ${error.message}`);
                overallValidity = false;
            }
        }

        this.#logger.info(`Task validation complete. Result: ${overallValidity ? 'PASSED' : 'FAILED'}`);
        return overallValidity;
    }
}

module.exports = TaskSchedulerValidatorEngine;