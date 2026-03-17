class TaskSequencerEngine {
    constructor(dependencyRegistry) {
        this.logger = dependencyRegistry.getLogger('PCRA_TSE');
        this.actionMap = dependencyRegistry.getActionMap();
    }

    /**
     * Executes a resolution strategy sequence defined by structured Task Objects.
     * @param {Array<Object>} sequence - The execution_sequence array.
     * @param {Object} incidentContext - Contextual data.
     */
    async executeStrategy(sequence, incidentContext) {
        this.logger.debug(`Starting sequenced execution for incident: ${incidentContext.id}`);

        for (const task of sequence) {
            const maxRetries = this.getMaxRetries(task.on_failure);
            let attempts = 0;
            let successful = false;

            while (attempts <= maxRetries && !successful) {
                attempts++;
                try {
                    await this.runTaskWithTimeout(task, incidentContext);
                    successful = true;
                } catch (error) {
                    this.logger.warn(`Task ${task.step_id} failed (Attempt ${attempts}/${maxRetries + 1}). Mode: ${task.on_failure}`);

                    if (attempts > maxRetries || task.on_failure === "FAIL_FAST") {
                        this.handleFailureEscalation(task.on_failure, task, incidentContext);
                        throw new Error(`Strategy aborted: Task ${task.step_id} failed permanently.`);
                    }
                    if (task.on_failure.startsWith("INITIATE_HUMAN")) {
                        this.handleFailureEscalation(task.on_failure, task, incidentContext);
                        return { status: "WAITING_OVERSIGHT", step: task.step_id };
                    }
                    // Exponential backoff or standardized wait
                    await new Promise(resolve => setTimeout(resolve, Math.min(100 * attempts * 2, 5000)));
                }
            }
        }
        return { status: "SUCCESS" };
    }

    getMaxRetries(failureMode) {
        const match = failureMode.match(/^RETRY_(\d+)X$/);
        return match ? parseInt(match[1], 10) : 0;
    }

    async runTaskWithTimeout(task, context) {
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
