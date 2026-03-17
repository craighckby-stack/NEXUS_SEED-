import json
import logging

logging.basicConfig(level=logging.INFO)

class DecisionEngine:
    def __init__(self, cdsm_path="governance/CDSM.json"):
        try:
            with open(cdsm_path, 'r') as f:
                self.matrix = json.load(f)
            self.weights = self.matrix.get('decision_weights', {})
        except FileNotFoundError:
            logging.error(f"CDSM not found at {cdsm_path}.")
            self.matrix = {}

    def calculate_proposal_score(self, proposal_metrics, risk_profile):
        """Calculates the final acceptance score for a proposal based on CDSM weights."""
        risk_config = self.matrix['risk_profiles'].get(risk_profile, {'severity_score': 1.0})
        
        test_confidence = proposal_metrics.get('test_confidence', 0.0) * self.weights.get('Weighted_Test_Confidence', 0)
        risk_impact = (1 - risk_config['severity_score']) * self.weights.get('Risk_Severity_Multiplier', 0)
        architecture_alignment = proposal_metrics.get('alignment_score', 0.0) * self.weights.get('Architectural_Alignment_Score', 0)

        final_score = test_confidence + risk_impact + architecture_alignment
        return round(final_score, 4)

    def determine_action(self, score, risk_profile):
        thresholds = self.matrix['decision_thresholds']
        risk_config = self.matrix['risk_profiles'].get(risk_profile, {})
        
        if score >= thresholds.get('Accept_Autonomous'):
            return {"status": "ACCEPTED", "action": "Proceed_to_Deployment"}
        elif score >= thresholds.get('Quorum_Required') and score >= risk_config.get('required_confidence_min', 0.0):
            return {"status": "QUORUM_VOTE", "action": "Initiate_Quorum_Review"}
        else:
            # Default to human mandatory review or optimization refactor
            return {"status": "REJECTED", "action": self.matrix['fallback_strategies']['default_low_score_action']}

    def evaluate(self, proposal_data):
        # proposal_data = {'metrics': {...}, 'risk_profile': 'High'}
        score = self.calculate_proposal_score(proposal_data['metrics'], proposal_data['risk_profile'])
        action = self.determine_action(score, proposal_data['risk_profile'])
        logging.info(f"Proposal Score: {score}, Determined Action: {action['action']}")
        return action
