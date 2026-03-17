/**
 * Governance_State_Aggregator.js
 * Role: Collects state reports from various components, validates against the Governance_State_Manifest schema,
 * calculates derived governance metrics (e.g., system-wide average compliance), and orchestrates snapshot storage.
 */

import { validateState } from '../validation/SchemaValidator';
import GovernanceManifestSchema from '../../schema/governance/Governance_State_Manifest.schema.json';

class GovernanceStateAggregator {
  constructor() {
    this.latestState = {};
  }

  /**
   * Receives and processes a partial or full state update.
   * @param {string} componentId - The source component identifier.
   * @param {object} componentState - The reported state data.
   */
  processUpdate(componentId, componentState) {
    if (!validateState(componentState, GovernanceManifestSchema.definitions.ComponentState)) {
      console.error(`[Governance] Invalid state received from ${componentId}`);
      // Handle logging/alerting for failed compliance reporting
      return false;
    }

    this.latestState[componentId] = componentState;
    this._recalculateManifest();
    return true;
  }

  /**
   * Calculates aggregated metrics and generates the final manifest structure.
   */
  _recalculateManifest() {
    const componentStates = Object.values(this.latestState);
    
    // 1. Calculate average policy compliance score
    const totalCompliance = componentStates.reduce((sum, state) => sum + state.policyCompliance, 0);
    const avgCompliance = componentStates.length > 0 ? totalCompliance / componentStates.length : 100;

    // 2. Determine overall system status
    let overallStatus = 'OPTIMAL';
    if (componentStates.some(c => c.health === 'HALTED' || c.health === 'CRITICAL_FAILURE')) {
      overallStatus = 'CRITICAL_FAILURE';
    } else if (avgCompliance < 90) {
      overallStatus = 'DEGRADED';
    }

    // Construct the final, compliant manifest object
    this.fullManifest = {
      manifestId: `MAN-${Date.now()}`,
      schemaVersion: 'v1.0',
      systemVersion: 'v94.1', // Placeholder: Should fetch dynamically
      timestamp: new Date().toISOString(),
      status: overallStatus,
      components: this.latestState
    };
    
    console.log(`[Governance] Manifest updated. Status: ${overallStatus}`);
    // In production, this would trigger storage and alert mechanisms.
  }

  getFullManifest() {
    return this.fullManifest;
  }
}

export default new GovernanceStateAggregator();
