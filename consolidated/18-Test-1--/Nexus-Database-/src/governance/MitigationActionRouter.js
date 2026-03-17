/**
 * MitigationActionRouter: 
 * Manages the intake, validation, and specialized routing of standardized 
 * governance mitigation action payloads based on the specified 'executor'.
 */

const Ajv = require('ajv');
const actionSchema = require('../../config/governance_mitigation_action_schema.json');
// Assuming a centralized logger utility
const logger = require('../utils/Logger'); 
// Custom error handling for governance domain failures
const { ActionValidationError, ExecutorNotFoundError } = require('./errors/GovernanceErrors'); 

class MitigationActionRouter {

  /**
   * @param {Map<string, IActionExecutor>} executorRegistry - Map of executor names to service instances.
   */
  constructor(executorRegistry) {
    if (!(executorRegistry instanceof Map)) {
        throw new TypeError("MitigationActionRouter requires a Map instance for executorRegistry.");
    }

    // Configure Ajv for detailed error reporting and default value population
    this.ajv = new Ajv({ allErrors: true, useDefaults: true });
    this.validator = this.ajv.compile(actionSchema);
    this.executorRegistry = executorRegistry; 
    logger.debug('MitigationActionRouter initialized, Schema Validator compiled.');
  }

  /**
   * Validates and routes the action payload to the designated specialized executor.
   * @param {Object} actionPayload - The payload describing the mitigation action.
   * @returns {Promise<{status: string, actionId: string, executorUsed: string}>}
   */
  async routeAction(actionPayload) {
    
    // 1. Validation
    if (!this.validator(actionPayload)) {
      const errors = this.validator.errors;
      logger.error('Mitigation action validation failed.', { errors, payload: actionPayload });
      throw new ActionValidationError('Invalid mitigation action payload provided.', errors);
    }

    const { executor, actionId, actionType, priority } = actionPayload;

    // 2. Executor Resolution
    const service = this.executorRegistry.get(executor);
    if (!service) {
      logger.warn(`Attempted to route action ${actionId} to unknown executor: ${executor}`);
      throw new ExecutorNotFoundError(`Mitigation executor service not found for identifier: ${executor}`);
    }

    // 3. Execution/Routing
    logger.info(`Routing Action ${actionId} [P:${priority}, T:${actionType}] to Executor: ${executor}`);
    
    try {
        // Execute the action (requires service implements IActionExecutor interface)
        await service.execute(actionPayload);
    } catch (error) {
        logger.error(`Failed to execute action ${actionId} via ${executor}. Propagating failure.`, { error, actionId });
        // Preserve specialized error type from the executor
        throw error; 
    }

    return { 
        status: 'ActionRoutedAndInitiated', 
        actionId: actionId,
        executorUsed: executor
    };
  }
}

module.exports = MitigationActionRouter;