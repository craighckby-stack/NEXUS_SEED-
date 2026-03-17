const RISK_DEFINITIONS = {
  "schema_version": "v1.0",
  "purpose": "Defines standardized risk levels used across the Policy Remediation Action Catalog and related GAX subsystems, mapping qualitative risk to measurable execution constraints.",
  "levels": {
    "LEVEL_0": {
      "display_name": "Informational/Read-Only",
      "score_range": "1",
      "description": "No operational impact. Purely passive logging or report generation.",
      "execution_constraints": {
        "isolation_mode": "STANDARD",
        "priority_modifier": "LOW",
        "logging_level": "WARNING",
        "auto_throttle_threshold": "HIGH"
      }
    },
    "LEVEL_1": {
      "display_name": "Low Configuration Impact",
      "score_range": "2-3",
      "description": "Minor state change within a contained subsystem; easily reversible.",
      "execution_constraints": {
        "isolation_mode": "STANDARD",
        "priority_modifier": "NORMAL",
        "logging_level": "INFO",
        "auto_throttle_threshold": "MEDIUM"
      }
    },
    "LEVEL_5": {
      "display_name": "Critical State Mutation",
      "score_range": "9-10",
      "description": "Direct mutation of primary execution kernel state or critical data resource; high potential for system instability. Requires explicit state locking.",
      "execution_constraints": {
        "isolation_mode": "SEQUESTERED_VM",
        "priority_modifier": "CRITICAL_PATH",
        "logging_level": "DEBUG_TRACE",
        "auto_throttle_threshold": "LOWEST",
        "required_pre_check": "STATE_LOCK_ACQUISITION"
      }
    }
  }
};

/**
 * Service to manage and provide standardized Policy Risk Level definitions.
 * Centralized under /governance to comply with Protocol 94.2 merger mandates.
 */
class PolicyRiskService {
    /**
     * Retrieves a single definition based on the level key.
     * @param {string} levelKey - E.g., 'LEVEL_5'.
     */
    static getDefinition(levelKey) {
        return RISK_DEFINITIONS.levels[levelKey];
    }
    
    /**
     * Retrieves the entire risk level definitions catalog.
     */
    static getAllDefinitions() {
        return RISK_DEFINITIONS.levels;
    }

    /**
     * Ensures all essential risk levels are defined (Implicit validation against schema).
     */
    static validateIntegrity() {
        return !!(RISK_DEFINITIONS.levels.LEVEL_0 && RISK_DEFINITIONS.levels.LEVEL_5);
    }
}

module.exports = PolicyRiskService;