/**
 * ProtocolExecutionFSM
 * Implements a Finite State Machine responsible for controlling the flow
 * of protocol verification, interpreting complex directives like 'RetryStep'
 * and 'HaltExecution' defined in the protocol definition schema.
 */

class ProtocolExecutionFSM {
  #protocol;
  #steps;
  #currentState;
  #currentStepIndex;
  #failurePolicyHandler;

  /**
   * @param {object} protocolDefinition The definition of the protocol.
   * @param {object} failurePolicyHandler An instance of the FailurePolicyHandler plugin interface.
   */
  constructor(protocolDefinition, failurePolicyHandler) {
    this.#setupDependencies(protocolDefinition, failurePolicyHandler);
  }

  /**
   * Extracts synchronous initialization and dependency validation.
   * @param {object} protocolDefinition
   * @param {object} failurePolicyHandler
   */
  #setupDependencies(protocolDefinition, failurePolicyHandler) {
    if (!failurePolicyHandler || typeof failurePolicyHandler.execute !== 'function') {
        throw new Error("ProtocolExecutionFSM requires a valid FailurePolicyHandler instance.");
    }
    
    this.#protocol = protocolDefinition;
    this.#steps = protocolDefinition.required_steps;
    this.#currentState = 'READY';
    this.#currentStepIndex = 0;
    
    this.#failurePolicyHandler = failurePolicyHandler; 
  }

  /**
   * Delegates the execution of the failure policy to the external handler (I/O Proxy).
   * @param {object} step 
   * @param {object} result 
   * @param {number} currentIndex 
   * @returns {object} policyResult
   */
  #delegateToFailurePolicyHandler(step, result, currentIndex) {
    return this.#failurePolicyHandler.execute({
        step: step,
        result: result, 
        currentIndex: currentIndex
    });
  }

  async executeProtocol() {
    this.#currentState = 'RUNNING';
    while (this.#currentStepIndex < this.#steps.length) {
      const step = this.#steps[this.#currentStepIndex];
      console.log(`Executing step: ${step.step_id}`);

      const result = await this.#runStep(step);

      if (!result.success) {
        // Delegate failure policy logic using the injected handler via proxy
        const policyResult = this.#delegateToFailurePolicyHandler(step, result, this.#currentStepIndex);

        this.#currentState = policyResult.newState;
        this.#currentStepIndex = policyResult.nextIndex;
        
        if (this.#currentState === 'HALTED') break;
        
      } else {
        this.#currentStepIndex++;
      }
    }
    this.#currentState = (this.#currentState === 'HALTED') ? 'FAILED' : 'COMPLETED';
    return this.#currentState;
  }

  async #runStep(step) {
    // Placeholder for PIM module execution logic
    // Actual execution would involve dynamic import/loading of step.verifier_module
    // using step.configuration and step.timeout_ms.
    return {
      success: true, // Simulate success for demonstration
      message: `Step ${step.step_id} verified.`
    };
  }
}
module.exports = ProtocolExecutionFSM;