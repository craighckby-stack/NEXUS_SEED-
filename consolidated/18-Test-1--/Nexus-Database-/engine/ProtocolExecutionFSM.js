/**
 * ProtocolExecutionFSM
 * Implements a Finite State Machine responsible for controlling the flow
 * of protocol verification, interpreting complex directives like 'RetryStep'
 * and 'HaltExecution' defined in the protocol definition schema.
 */
class ProtocolExecutionFSM {
  constructor(protocolDefinition) {
    this.protocol = protocolDefinition;
    this.steps = protocolDefinition.required_steps;
    this.currentState = 'READY';
    this.currentStepIndex = 0;
  }

  async executeProtocol() {
    this.currentState = 'RUNNING';
    while (this.currentStepIndex < this.steps.length) {
      const step = this.steps[this.currentStepIndex];
      console.log(`Executing step: ${step.step_id}`);

      const result = await this._runStep(step);

      if (!result.success) {
        await this._handleFailure(step, result);
        if (this.currentState === 'HALTED') break;
      } else {
        this.currentStepIndex++;
      }
    }
    this.currentState = (this.currentState === 'HALTED') ? 'FAILED' : 'COMPLETED';
    return this.currentState;
  }

  async _runStep(step) {
    // Placeholder for PIM module execution logic
    // Actual execution would involve dynamic import/loading of step.verifier_module
    // using step.configuration and step.timeout_ms.
    return {
      success: true, // Simulate success for demonstration
      message: `Step ${step.step_id} verified.`
    };
  }

  async _handleFailure(step, result) {
    const action = step.on_failure || 'HaltExecution'; // Default if not specified

    switch (action) {
      case 'HaltExecution':
        console.error(`Failure: ${step.step_id}. Action: HALT.`);
        this.currentState = 'HALTED';
        break;
      case 'ContinueWarning':
        console.warn(`Failure: ${step.step_id}. Action: WARNING and CONTINUE.`);
        this.currentStepIndex++; // Move to next step despite failure
        break;
      case 'RetryStep':
        // Implements basic retry logic (could be improved with count)
        console.warn(`Failure: ${step.step_id}. Action: RETRY.`);
        // We do not increment index, forcing re-execution of the current step
        // A sophisticated implementation would track retry count here.
        break;
      default:
        console.error(`Unknown failure action: ${action}. Halting.`);
        this.currentState = 'HALTED';
    }
  }
}
module.exports = ProtocolExecutionFSM;