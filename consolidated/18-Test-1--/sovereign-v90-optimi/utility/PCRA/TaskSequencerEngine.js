class TaskSequencerEngine {
    constructor(dependencyRegistry) {
        this.logger = dependencyRegistry.getLogger('PCRA_TSE');
        this.actionMap = dependencyRegistry.getActionMap();
        // Assuming plugin registration or dependency injection provides the utility
        this.executionRetryManager = dependencyRegistry.getUtility('ExecutionRetryManager');
    }

    /**
     * Executes a resolution strategy sequence defined by structured Task Objects.
     * @param {Array<Object>} sequence - The execution_sequence array.
     * @param {Object} incidentContext - Contextual data.
     */
    async executeStrategy(sequence, incidentContext) {
        this.logger.debug(`Starting sequenced execution for incident: ${incidentContext.id}`);

        if (!this.executionRetryManager) {
            throw new Error("ExecutionRetryManager utility is required but missing.");
        }

        for (const task of sequence) {
            
            // Define the worker function for the plugin
            const workerFn = async () => {
                await this.runTask(task, incidentContext);
            };

            try {
                const result = await this.executionRetryManager.executeWithRetries(
                    workerFn,
                    task.on_failure,
                    this.logger,
                    { step_id: task.step_id } // Context required by the plugin's logging/status
                );

                if (result.status === "WAITING_OVERSIGHT") {
                    this.handleFailureEscalation(task.on_failure, task, incidentContext);
                    return { status: "WAITING_OVERSIGHT", step: task.step_id };
                }

                this.logger.debug(`Task ${task.step_id} succeeded after ${result.attempts} attempt(s).`);

            } catch (error) {
                // This catch block handles permanent failure (max retries reached or FAIL_FAST)
                this.handleFailureEscalation(task.on_failure, task, incidentContext);
                throw new Error(`Strategy aborted: Task ${task.step_id} failed permanently. Reason: ${error.message}`);
            }
        }
        return { status: "SUCCESS" };
    }

    /**
     * Runs the defined action, passing along the timeout parameter.
     */
    async runTask(task, context) {
        if (!this.actionMap[task.action]) {
            throw new Error(`Action handler missing for: ${task.action}`);
        }
        return await this.actionMap[task.action](task.parameters, context, task.timeout_ms);
    }

    handleFailureEscalation(mode, task, context) {
        this.logger.critical(`PCRA Escalation: Mode ${mode} triggered by ${task.step_id}. Incident: ${context.id}`);
        // Logic to notify monitoring subsystems or dispatch manual override request
    }
}
module.exports = TaskSequencerEngine;