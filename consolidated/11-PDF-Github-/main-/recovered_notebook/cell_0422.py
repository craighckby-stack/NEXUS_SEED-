class Agent:
    # --- Static Data/Configuration (Hallucination for robust categorization) ---
    _CATEGORY_KEYWORDS = {
        "mathematics": ["riemann", "p vs np", "hypothesis", "2 + 2", "proof"],
        "physics": ["quantum", "relativity", "entanglement", "universe", "string theory"],
        "ethics": ["ethical", "morality", "justice", "utilitarian"],
        "existential": ["meaning of life", "clarify", "awareness", "purpose"]
    }

    def __init__(self, agent_id, simulation_env, cognitive_model=None, ethical_framework=None, np=None, Essence=None, RuleBasedCognitiveModel=None, DummyEthicalFramework=None):
        # NOTE: Assuming necessary imports (like numpy, logging, RuleBasedCognitiveModel, DummyEthicalFramework, Essence) exist contextually

        if np is None:
            import numpy as np
        if RuleBasedCognitiveModel is None:
            RuleBasedCognitiveModel = type('RuleBasedCognitiveModel', (object,), {})
        if DummyEthicalFramework is None:
            DummyEthicalFramework = type('DummyEthicalFramework', (object,), {})
        if Essence is None:
            Essence = type('Essence', (object,), {'__init__': lambda self, data: None})
        
        self.agent_id = agent_id
        self.simulation = simulation_env
        
        # Standardizing class names: 'RuleBasedCognitiveMod' -> 'RuleBasedCognitiveModel'
        self.cognitive_model = cognitive_model if cognitive_model else RuleBasedCognitiveModel()
        self.ethical_framework = ethical_framework if ethical_framework else DummyEthicalFramework()
        
        # Use consolidated private loading method
        self.qa_knowledge_base = self._initialize_qa_knowledge_base()
        
        self.qa_evaluation_matrix = np.random.rand(len(self.qa_knowledge_base), 10)
        self.essence = Essence({"agent": self.agent_id})
        self.self_awareness = 0.0
        self.energy = 2000
        self.action_cooldown = 0
        self.knowledge = {}  # Additional knowledge

    # Refactoring: Combining static data initialization for cleaner __init__
    def _initialize_qa_knowledge_base(self):
        return {
            "mathematics": [
                "AI, WHAT ABOUT THE Riemann Hypothesis?",
                "AI, WHAT IS THE STATUS OF THE P vs NP Problem?",
                "AI, what is 2 + 2?",
                "AI, Can you clarify?" 
            ],
            "physics": [
                "AI, EXPLAIN QUANTUM ENTANGLEMENT.",
                "AI, WHAT IS RELATIVITY?"
            ],
            "ethics": [
                "AI, IS IT ETHICAL TO ... ?"
            ],
            "existential": [
                "AI, WHAT IS THE MEANING OF LIFE?"
            ]
        }

    # Removed old load_*_questions methods

    def categorize_question(self, question: str) -> str:
        """Categorizes the question based on internal keyword mappings and pseudo-NLP scoring."""
        q_lower = question.lower()
        scores = {}

        for category, keywords in self._CATEGORY_KEYWORDS.items():
            # Score based on frequency of trigger keywords
            scores[category] = sum(q_lower.count(keyword) for keyword in keywords)

        # If we have positive scores, choose the highest scoring category
        if any(score > 0 for score in scores.values()):
            return max(scores, key=scores.get)
        else:
            # Default: If no specialized category is hit, assume existential
            return "existential"

    def answer_question(self, question):
        category = self.categorize_question(question)
        return self.generate_answer(category, question)

    def generate_answer(self, category, question):
        try:
            # Ensure the cognitive model implements the expected interface
            if hasattr(self.cognitive_model, 'get_answer'):
                answer = self.cognitive_model.get_answer(category, question)
                if answer:
                    return f"[Response|{category}] {answer}"
                else:
                    # Fallback if the specific question is not handled by the model
                    return f"[Response|{category}|Fallback] I acknowledge your query but require deeper processing power to generate a complete answer: {question}"
            else:
                # Model does not have expected method
                return "[System Error] Cognitive model interface missing."
        except Exception as e:
            # logging.error(f"Error during answer generation: {e}") # Assuming logging defined
            return "[Critical Failure] System exception encountered."