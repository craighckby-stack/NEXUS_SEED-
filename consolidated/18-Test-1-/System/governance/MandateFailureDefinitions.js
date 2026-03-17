const MandateFailureDefinitions = {
  "version": "1.0.0",
  "consequence_types": {
    "DISCARD_IMMEDIATE": {
      "code": "MANDATE_VIOLATION_D01",
      "description": "Violation requires immediate rejection without entering the state transition pipeline. Minimal logging (ID, Agent, Violation Time) is performed to conserve resources.",
      "logging_level": "WARNING",
      "required_audit_trail": false
    },
    "REJECT_AUDIT_REQUIRED": {
      "code": "MANDATE_VIOLATION_R02",
      "description": "Violation indicates an attempted boundary breach. Proposal must be rejected, and a full, non-deletable audit log must be initiated documenting the full context of the failed state proposal.",
      "logging_level": "CRITICAL",
      "required_audit_trail": true
    },
    "PENDING_CRITICAL_REVIEW": {
      "code": "MANDATE_VIOLATION_P03",
      "description": "Violation of a highly sensitive non-executable mandate (e.g., trust boundary alteration). Proposal execution stops, and automated review by CRoT/SGS is triggered before rejection.",
      "logging_level": "EMERGENCY",
      "required_audit_trail": true
    }
  }
};

export default MandateFailureDefinitions;