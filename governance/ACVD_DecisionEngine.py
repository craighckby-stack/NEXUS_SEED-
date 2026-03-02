import json
from datetime import datetime
from typing import Dict, Any

class ACVD_DecisionEngine:
    """Manages state transitions and validation enforcement based on the ACVD schema."""

    def __init__(self, schema_path='governance/ACVD_schema.json'):
        self.schema = self._load_schema(schema_path)

    def _load_schema(self, path):
        # In a real system, this would load and compile the schema validator
        # For scaffolding, we just acknowledge the requirement.
        return {"status": "loaded"}

    def validate_proposal(self, proposal: Dict[str, Any]) -> bool:
        """Checks if the proposal conforms to the ACVD schema structure and passes basic metrics checks."""
        if proposal.get('state') != 'PENDING_VALIDATION':
            return False
        
        # Placeholder for complex AGI validation checks:
        if proposal.get('validationMetrics', {}).get('regressionTestStatus') != 'PASS':
            raise ValueError("Proposal failed critical regression tests.")
        
        if proposal.get('safetyAssessment', {}).get('confidenceScore', 0) < 0.85:
            raise ValueError("Confidence score below minimum threshold (0.85).")
            
        return True

    def transition_state(self, proposal: Dict[str, Any], new_state: str, decision_maker: str, reason: str) -> Dict[str, Any]:
        """Records a state change in the decision history and updates the current state."""
        if new_state not in self.schema.get('properties', {}).get('state', {}).get('enum', []):
             raise ValueError(f"Invalid target state: {new_state}")

        new_entry = {
            "decisionMaker": decision_maker,
            "decisionType": "STATE_CHANGE",
            "reason": reason,
            "timestamp": datetime.utcnow().isoformat() + 'Z'
        }
        
        proposal['state'] = new_state
        proposal['decisionHistory'].append(new_entry)
        return proposal

# Example Usage Stub:
# engine = ACVD_DecisionEngine()
# approved_proposal = engine.transition_state(proposal_data, 'APPROVED', 'AGI/Sovereign', 'All metrics passed thresholds.')