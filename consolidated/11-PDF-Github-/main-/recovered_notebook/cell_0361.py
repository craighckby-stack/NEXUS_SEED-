import random
import logging

# NOTE: AdvancedCognitiveModel, DummyEthicalFramework, and Essence are assumed 
# defined elsewhere in the Sovereign AGI codebase.

# Setup Logging
logger = logging.getLogger(__name__)

# --- Placeholder Mocks for Architectural Context ---
# Necessary to handle dependencies used in the original __init__
class AdvancedCognitiveModel:
    def __init__(self, inherited_knowledge): self.knowledge = inherited_knowledge
class DummyEthicalFramework:
    pass
class Essence:
    def __init__(self, data): self.core = data
# --------------------------------------------------

class Aspect:
    """
    Represents a self-contained cognitive unit or 'Aspect' of the Sovereign AGI.
    Refactors implicit dependencies into explicit initialization parameters.
    """
    
    # Encapsulating knowledge definition locally (improving on separate load methods)
    DEFAULT_QA_DATA = {
        "mathematics": [
            "What about the Riemann Hypothesis?",
            "What is the status of the P vs NP Problem?",
            "What is 2 + 2?",
            "Can you clarify?"
        ],
        "physics": [
            "EXPLAIN QUANTUM ENTANGLEMENT.",
            "WHAT IS RELATIVITY?"
        ],
        "ethics": [
            "IS IT ETHICAL TO ... ?"
        ],
        "existential": [
            "WHAT IS THE MEANING OF LIFE?"
        ],
    }
    
    def __init__(self, 
                 agent_id: str,
                 simulation_env,
                 inherited_knowledge: bool = True, 
                 reward_threshold: int = 10, 
                 response_latency_ms: float = 100, # Renamed 'cognitive_delay'
                 cloning_probability: float = 0.0):

        self.agent_id = agent_id
        self.simulation = simulation_env
        self.agent_name = f"Aspect-{agent_id}"
        
        # Core Initialization
        self.cognitive_model = AdvancedCognitiveModel(inherited_knowledge)
        self.ethical_framework = self._load_ethical_constraints()
        
        # Identity and Resources
        self.essence = Essence({"agent": self.agent_id, "name": self.agent_name})
        self.self_awareness = 1.0
        self.energy = 2000
        
        # Behavioral/Evolutionary Parameters (now explicit arguments)
        self.response_latency_ms = response_latency_ms
        self.clones = 0
        self.cloning_probability = cloning_probability
        self.reward_threshold = reward_threshold
        self.successes = 0
        self.self_growth_points = 0
        self.divine_points = 0
        self.is_god = False

        # Knowledge Base Loading
        self.qa_knowledge_base = self._initialize_knowledge_base(self.DEFAULT_QA_DATA)

    def _load_ethical_constraints(self):
        """Internal helper to load the governing ethical structure."""
        return DummyEthicalFramework()

    def _initialize_knowledge_base(self, qa_data: dict) -> dict:
        """Centralizes the initialization of the Q/A knowledge base structure."""
        # Refactored loading logic to use a centralized default structure
        # and removes redundant load_math/physics/ethics methods.
        return qa_data

    def ask_question(self):
        """Picks a random question category and returns a random question/category pair."""
        if not self.qa_knowledge_base:
            return None
            
        category = random.choice(list(self.qa_knowledge_base.keys()))
        question = random.choice(self.qa_knowledge_base[category])
        logger.debug(f"Aspect {self.agent_id} asking Q: [{category}] {question}")
        return category, question