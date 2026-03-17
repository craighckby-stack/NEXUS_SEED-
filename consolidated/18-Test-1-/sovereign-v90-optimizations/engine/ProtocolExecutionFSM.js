class ProtocolExecutionFSM {
  #protocol;
  #steps;
  #currentState;
  #currentStepIndex;
  #failurePolicyHandler;

  /**
   * Creates a new ProtocolExecutionFSM instance.
   * @param {object} protocolDefinition The definition of the protocol.
   * @param {object} failurePolicyHandler An instance of the FailurePolicyHandler plugin interface.
   * @throws {Error} If failurePolicyHandler is invalid.
   */
  constructor(protocolDefinition, failurePolicyHandler) {
    this.#setupDependencies(protocolDefinition, failurePolicyHandler);
  }

  /**
   * Initializes the FSM with required dependencies and validates inputs.
   * @param {object} protocolDefinition
   * @param {object} failurePolicyHandler
   * @throws {Error} If failurePolicyHandler is invalid.
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
   * Delegates the execution of the failure policy to the external handler.
   * @param {object} step - The step that failed.
   * @param {object} result - The result of the failed step.
   * @param {number} currentIndex - The index of the failed step.
   * @returns {object} policyResult - The result from the failure policy handler.
   */
  #delegateToFailurePolicyHandler(step, result, currentIndex) {
    return this.#failurePolicyHandler.execute({
      step,
      result,
      currentIndex
    });
  }

  /**
   * Executes the protocol step by step using the defined state machine.
   * @returns {Promise<string>} The final state of the protocol execution.
   */
  async executeProtocol() {
    this.#currentState = 'RUNNING';

    while (this.#currentStepIndex < this.#steps.length) {
      const step = this.#steps[this.#currentStepIndex];
      const result = await this.#runStep(step);

      if (!result.success) {
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

  /**
   * Executes a single step in the protocol.
   * @param {object} step - The step to execute.
   * @returns {Promise<object>} The result of the step execution.
   */
  async #runStep(step) {
    // Placeholder for PIM module execution logic
    // Actual implementation would dynamically import and execute step.verifier_module
    // using step.configuration and step.timeout_ms.
    return {
      success: true,
      message: `Step ${step.step_id} verified.`
    };
  }
}

module.exports = ProtocolExecutionFSM;
