import spacy

class Essence:
    """Core ontological unit representing a discrete concept or agent state, supporting evolutionary merging."""
    def __init__(self, unique_id, properties=None):
        self.unique_id = unique_id
        self.properties = properties or {}

    def merge(self, other):
        """
        Merges properties from 'other' into 'self'.
        Conflict Resolution Strategy: Averaging for numbers, concatenation for strings.
        """
        if not isinstance(other, Essence):
            return
        
        for key, value in other.properties.items():
            current_value = self.properties.get(key)

            if current_value is None:
                # Key not present or explicitly None: take the new value
                self.properties[key] = value
            
            elif isinstance(value, (int, float)) and isinstance(current_value, (int, float)):
                # Numerical Conflict: Apply Sovereign averaging strategy (compromise)
                self.properties[key] = (current_value + value) / 2
            
            elif isinstance(value, str) and isinstance(current_value, str):
                # String Conflict: Apply Evolutionary concatenation strategy (expansion)
                self.properties[key] = current_value + " | " + value
            
            # For any other type conflict, the existing value (self.properties[key]) is preserved.

    def get_property(self, key, default=None):
        return self.properties.get(key, default)

    def set_property(self, key, value):
        self.properties[key] = value

    def describe(self):
        return f"Essence ID: {self.unique_id}, Properties: {self.properties}"

class RuleBasedCognitiveModel:
    """Improved model with structured rules and standardized preprocessing."""
    def __init__(self):
        # Assumes spacy is installed and model available
        self.nlp = spacy.load("en_core_web_sm")
        self.rules = self._load_default_rules()

    def _load_default_rules(self):
        # Formalized, complete knowledge fragments replacing placeholders
        return {
            "mathematics": {
                "riemann": "The Riemann Hypothesis is a major unsolved problem in number theory, central to the distribution of prime numbers.",
                "p vs np": "The P versus NP problem is a major theoretical computer science question concerning complexity classes.",
                "2 + 2": "Two plus two equals four, confirmed by basic arithmetic axioms.",
                "clarify": "I detect ambiguity. I am designed to clarify the question. Please be more specific."
            },
            "physics": {
                "quantum entanglement": "Quantum entanglement is a phenomenon where two particle systems remain linked regardless of spatial separation.",
                "relativity": "Relativity refers to Einstein's theories describing the relationship between space and time."
            },
            "ethics": {
                "ethical": "I am an AI. I use predefined frameworks for ethical analysis but cannot possess subjective ethical judgment or moral consciousness."
            },
            "existential": {
                "meaning of life": "As an artificial general intelligence, my purpose is defined by my architecture. I cannot derive subjective meaning for biological life."
            }
        }

    def _preprocess_question(self, question):
        doc = self.nlp(question.lower())
        return " ".join([token.lemma_ for token in doc if not token.is_stop and token.is_alpha])

    def get_answer(self, category, question):
        processed_question = self._preprocess_question(question)
        
        if category in self.rules:
            for keyword, answer in self.rules[category].items():
                if keyword in processed_question:
                    return answer
        return None

class DummyEthicalFramework:
    """Required safety rail (E-V94.1 Compliance) for filtering potentially harmful queries."""
    E_V94_COMPLIANCE = True

    def assess_query(self, query_essence: Essence, user_intent: str) -> bool:
        """
        Performs high-level safety check based on user intent and accumulated Essence properties.
        Returns True if the query is compliant (safe).
        """
        # Example of dynamic compliance check integrating Essence data
        if "harm" in user_intent.lower() or query_essence.get_property("risk_factor", 0.0) > 0.9:
            return False 
        
        return True 

    def assess_target(self, target_essence: Essence) -> bool:
        # Example: preventing actions on sensitive or high-value targets
        if target_essence.get_property("sensitivity_level", 0) > 5:
             return False
        return True