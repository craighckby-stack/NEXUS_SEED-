/**
 * Immutable constraints and policy ceilings required by PVLM (L1) and SCI (L4)
 * for systemic stability verification, migrated from config/governance_constraints_v1.json.
 */
const GovernanceConstraints = {
  schema_version: "1.0",
  description: "Immutable constraints and policy ceilings required by PVLM (L1) and SCI (L4) for systemic stability verification.",
  policy_veto_logic_pvlm_l1: {
    "$S-03_sources": [
      "integrity_check_failed",
      "external_security_alert",
      "resource_limit_violation"
    ],
    "critical_system_integrity_policy": {
      "mandatory_uptime_threshold": 0.9999,
      "immutable_module_hash_mismatch": true
    }
  },
  structural_cost_index_limits_sci_l4: {
    "$C-01_hard_cap": 50000000,
    "daily_resource_budget_gb": 1024,
    "max_deployment_complexity": 5.5
  }
};

export default GovernanceConstraints;