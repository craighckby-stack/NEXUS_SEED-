/**
 * MitigationActionRouter: 
 * Responsible for consuming a governance violation event, validating the resulting mitigation action 
 * against the 'governance_mitigation_action_schema.json', and routing the validated action 
 * payload to the correct specialized executor service defined in 'action.executor'.
 */

const Ajv = require('ajv');
const actionSchema = require('../../config/governance_mitigation_action_schema.json');

export class MitigationActionRouter {
  constructor(executorRegistry) {
    this.ajv = new Ajv();
    this.validate = this.ajv.compile(actionSchema);
    this.executorRegistry = executorRegistry; // Map of executor names to service instances
  }

  async routeAction(actionPayload) {
    if (!this.validate(actionPayload)) {
      throw new Error(`Invalid mitigation action payload: ${JSON.stringify(this.validate.errors)}`);
    }

    const { executor, actionId, actionType, priority } = actionPayload;

    const service = this.executorRegistry.get(executor);
    if (!service) {
      throw new Error(`Mitigation executor not found: ${executor}`);
    }

    console.log(`Routing Action ${actionId} [P:${priority}] via ${actionType} to ${executor}`);
    
    // Execute the action asynchronously or queue it based on priority
    await service.execute(actionPayload);

    return { status: 'Routed', actionId };
  }
}
