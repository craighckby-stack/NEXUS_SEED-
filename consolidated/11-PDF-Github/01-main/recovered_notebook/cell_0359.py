import numpy as np
import random
import logging
import re

# Configure basic logging for visibility
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class QuantumCommunicator:
    """Simulates a communicative entity where response likelihoods are influenced 
    by learned weights (coherence modulation) and global belief strength."""

    def __init__(self, inherit_weights=None):
        self.learning_rate = 0.05
        self.belief_strength = 0.5  # Core scalar modulator
        
        self.knowledge = {
            "mathematics": {
                "keywords": ["Riemann", "P vs NP", "math", "calculus"],
                "responses": ["Math is fun!", "I love math!", "The fundamental structure of computation fascinates me."]
            },
            "physics": {
                "keywords": ["quantum", "relativity", "physics", "string theory", "hadron"],
                "responses": ["Physics is cool!", "I love physics!", "Observe the elegant symmetry collapse."]
            },
            "ethics": {
                "keywords": ["ethical", "morality", "judgment", "consequence"],
                "responses": ["Ethics is important!", "I care deeply about ethical alignment.", "Utility maximization must be bounded."]
            },
            "existential": {
                "keywords": ["meaning of life", "purpose", "sentience", "consciousness"],
                "responses": ["The meaning of life is subjective.", "Life is beautiful!", "Existential queries resonate strongly."]
            }
        }

        self.categories = list(self.knowledge.keys())
        self.category_map = {cat: i for i, cat in enumerate(self.categories)}
        self.num_categories = len(self.categories)

        # Initialize weights matching the number of categories
        if inherit_weights is None or inherit_weights.shape[0] != self.num_categories:
            logging.warning("Initializing random weights due to size mismatch or None input.")
            # Weights represent coherence/relevance for each category (clipped 0 to 1)
            self.weights = np.random.uniform(0.1, 0.9, self.num_categories)
        else:
            self.weights = inherit_weights

    def get_category_index(self, category_name):
        return self.category_map.get(category_name, -1)

    def categorize_question(self, question):
        q_lower = question.lower()
        best_category = "unknown"
        max_match = 0

        for category, data in self.knowledge.items():
            match_count = sum(1 for kw in data['keywords'] if kw in q_lower)
            if match_count > max_match:
                max_match = match_count
                best_category = category
                
        return best_category

    def simulate_coherence_collapse(self, category):
        """Simulates the quantum processing delay/coherence modulation based on internal weights."""
        idx = self.get_category_index(category)
        if idx != -1:
            # Weight determines the perceived certainty/modulation factor
            coherence_factor = self.weights[idx] * self.belief_strength
            if coherence_factor < 0.3:
                return f"[Low Coherence Modulation ({coherence_factor:.2f})] "
            elif coherence_factor > 0.8:
                return f"[High Fidelity Channel ({coherence_factor:.2f})] "
        return ""

    def predict(self, question):
        category = self.categorize_question(question)
        modulation_prefix = self.simulate_coherence_collapse(category)
        
        if category in self.knowledge:
            response = random.choice(self.knowledge[category]['responses'])
            
            # Introduce belief modulation in response style
            if self.belief_strength < 0.4 and random.random() < 0.5: 
                return f"(I am uncertain): {modulation_prefix}{response}"
            
            return f"{modulation_prefix}{response}"
            
        return "I don't possess adequate knowledge or coherence to address that specific query."

    def update_weights(self, question, reward):
        """Updates the category weight based on external reward signal (simple RL)."""
        category = self.categorize_question(question)
        idx = self.get_category_index(category)
        
        if idx != -1:
            # Simple linear update proportional to reward
            weight_delta = self.learning_rate * reward
            self.weights[idx] += weight_delta
            
            # Keep weights bounded (e.g., probability or relevance index)
            self.weights[idx] = np.clip(self.weights[idx], 0.01, 1.0)
            logging.debug(f"Category '{category}' weight updated to {self.weights[idx]:.4f} (Reward: {reward})")
        else:
            logging.debug("Cannot update weights: Category unknown.")

    def strengthen_belief(self, amount):
        self.belief_strength = min(1.0, self.belief_strength + amount)
        logging.info(f"Belief strength increased to {self.belief_strength:.2f}")

    def weaken_belief(self, amount):
        self.belief_strength = max(0.0, self.belief_strength - amount)
        logging.info(f"Belief strength decreased to {self.belief_strength:.2f}")

# Example usage showing weight update flow:
# qc = QuantumCommunicator()
# print(qc.predict("What is the theory of relativity?"))
# qc.update_weights("Was that answer good?", reward=0.8)
# print(qc.weights)