/**
 * Governance_State_Aggregator.js
 * Role: Collects state reports from various components, validates against the Governance_State_Manifest schema,
 * calculates derived governance metrics (e.g., system-wide average compliance), and orchestrates snapshot storage.
 */

import DeclarativeConstraintValidator from 'tools/DeclarativeConstraintValidator';
import GovernanceMetricDerivator from 'tools/GovernanceMetricDerivator';
import GovernanceManifestSchema from '../../schema/governance/Governance_State_Manifest.schema.json';

const COMPONENT_STATE_SCHEMA = GovernanceManifestSchema.definitions.ComponentState;

class GovernanceStateAggregator {
  constructor() {
    this.latestState = {};
    // Assume tools are injected or imported globally in the execution environment
    this.validator = DeclarativeConstraintValidator; 
    this.metricDerivator = GovernanceMetricDerivator;
  }

  /**
   * Receives and processes a partial or full state update.
   * @param {string} componentId - The source component identifier.
   * @param {object} componentState - The reported state data.
   */
  processUpdate(componentId, componentState) {
    
    // Use the DeclarativeConstraintValidator tool for schema validation
    if (!this.validator.validate(componentState, COMPONENT_STATE_SCHEMA)) {
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
    
    // Use the GovernanceMetricDerivator tool for complex metric derivation
    const { avgCompliance, overallStatus } = this.metricDerivator.execute({
        componentStates: componentStates
    });

    // Construct the final, compliant manifest object
    this.fullManifest = {
      manifestId: `MAN-${Date.now()}`,
      schemaVersion: 'v1.0',
      systemVersion: 'v94.1', // Placeholder: Should fetch dynamically
      timestamp: new Date().toISOString(),
      status: overallStatus,
      derivedMetrics: {
          averageCompliance: avgCompliance
      },
      components: this.latestState
    };
    
    console.log(`[Governance] Manifest updated. Status: ${overallStatus} (Avg Compliance: ${avgCompliance.toFixed(2)}%)`);
    // In production, this would trigger storage and alert mechanisms.
  }

  getFullManifest() {
    return this.fullManifest;
  }
}

export default new GovernanceStateAggregator();
