import numpy as np
import logging
from typing import Dict, Any, List, Optional
from enum import Enum

# --- Hallucinated/Mock Definitions for Context ---
class DummyEthicalFramework:
    def assess_action(self, action: str, agent_id: str) -> bool:
        logging.debug(f"Assessing action '{action}' for {agent_id} (Dummy: True)")
        return True

class RuleBasedCognitiveModel:
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
    # Mock method required by Aspect for future use
    # def process_query(self, question: str, category: str):
    #     return f"Model processing {question} in {category}"

class SimulationEnvironment:
    pass # Placeholder

class Essence:
    def __init__(self, data: Dict[str, Any]):
        self.data = data
# ---------------------------------------------------


class AspectState(Enum):
    ACTIVE = 'Active'
    LOW_ENERGY = 'LowEnergy'
    COOLDOWN = 'Cooldown'
    ETHICAL_PAUSE = 'EthicalPause'


class Aspect:
    
    CATEGORY_KEYWORDS: Dict[str, List[str]] = {
        "mathematics": ["riemann", "p vs np", "math", "clarify", "calculation", "proof", "number", "+"],
        "physics": ["quantum", "relativity", "physics", "explain", "energy", "spacetime", "field", "entanglement"],
        "ethics": ["ethical", "moral", "ought", "should i", "justification"],
        "existential": ["meaning of life", "existential", "why are we here", "purpose", "consciousness"]
    }
    
    DEFAULT_QUESTIONS = {
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
            "AI, WHAT IS THE MEANING OF LIFE?",
            "AI, why are we here?"
        ]
    }

    ENERGY_COST_PER_QUERY = 100
    COOLDOWN_PER_QUERY = 5

    def __init__(self, 
                 agent_id: str, 
                 simulation_env: 'SimulationEnvironment', 
                 cognitive_model: Optional['RuleBasedCognitiveModel'] = None, 
                 ethical_framework: Optional['DummyEthicalFramework'] = None):
        
        self.agent_id = agent_id
        self.simulation = simulation_env
        # Type refinement for cognitive model initialization
        self.cognitive_model = cognitive_model if cognitive_model else RuleBasedCognitiveModel(agent_id)
        self.ethical_framework = ethical_framework if ethical_framework else DummyEthicalFramework()
        
        self.qa_knowledge_base: Dict[str, List[str]] = self._initialize_qa_knowledge_base()
        
        # Placeholder for complex matrices. Assuming 4 categories, 10 metrics.
        self.qa_evaluation_matrix: np.ndarray = np.random.rand(4, 10) 
        
        self.essence = Essence({"agent": self.agent_id, "context_version": "v94.1"})
        
        # State management (using private attributes managed by properties)
        self._self_awareness: float = 0.0
        self._energy: int = 2000
        self._action_cooldown: int = 0
        self.state: AspectState = AspectState.ACTIVE

    # --- Properties for Controlled State Access ---
    
    @property
    def self_awareness(self) -> float:
        return self._self_awareness
    
    @self_awareness.setter
    def self_awareness(self, value: float):
        # Ensure bounded awareness (0.0 to 1.0)
        self._self_awareness = np.clip(value, 0.0, 1.0) 
    
    @property
    def energy(self) -> int:
        return self._energy

    @energy.setter
    def energy(self, value: int):
        self._energy = max(0, value)
        # Transition state based on resource levels
        if self._energy < self.ENERGY_COST_PER_QUERY * 2 and self.state not in (AspectState.LOW_ENERGY, AspectState.COOLDOWN):
            self.state = AspectState.LOW_ENERGY
            logging.warning(f"Agent {self.agent_id} entered LOW_ENERGY state.")
        elif self._energy >= self.ENERGY_COST_PER_QUERY * 4 and self.state == AspectState.LOW_ENERGY:
            self.state = AspectState.ACTIVE

    @property
    def action_cooldown(self) -> int:
        return self._action_cooldown
    
    @action_cooldown.setter
    def action_cooldown(self, value: int):
        self._action_cooldown = max(0, value)
        if self._action_cooldown > 0 and self.state != AspectState.COOLDOWN:
            self.state = AspectState.COOLDOWN
        elif self._action_cooldown == 0 and self.state == AspectState.COOLDOWN:
            self.state = AspectState.ACTIVE
    
    # --------------------------------------------

    def _initialize_qa_knowledge_base(self) -> Dict[str, List[str]]:
        # Loads questions from the standardized class constant
        return self.DEFAULT_QUESTIONS

    def categorize_question(self, question: str) -> str:
        """
        Data-driven keyword matching for robust categorization using CATEGORY_KEYWORDS.
        """
        q_lower = question.lower()
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            if any(keyword in q_lower for keyword in keywords):
                return category
        
        # Default all complex/unknown queries to 'existential' (as per original logic intent)
        return "existential"

    def check_preconditions(self, action: str) -> Optional[str]:
        """Checks if the Aspect is ready to perform a specific action."""
        if self.action_cooldown > 0:
            return f"Cooldown active ({self.action_cooldown} cycles remaining)."
        
        required_energy = self.ENERGY_COST_PER_QUERY
        if self.energy < required_energy:
            return f"Insufficient energy ({self.energy}/{required_energy}). State: {self.state.value}"
        
        if not self.ethical_framework.assess_action(action, self.agent_id):
            self.state = AspectState.ETHICAL_PAUSE
            return "Action failed ethical screening."
            
        return None # Ready to proceed

    def answer_question(self, question: str):
        
        precheck = self.check_preconditions("process_query")
        if precheck:
            logging.warning(f"Agent {self.agent_id} cannot answer: {precheck}")
            return f"Error: Agent state constraint: {precheck}"
            
        category = self.categorize_question(question)
        
        # Resource consumption and state update
        self.energy -= self.ENERGY_COST_PER_QUERY # Uses setter logic
        self.action_cooldown = self.COOLDOWN_PER_QUERY # Uses setter logic
        
        logging.info(f"Query handled. Category: {category}. Energy remaining: {self.energy}")
        
        # Actual query processing via cognitive model would occur here
        # return self.cognitive_model.process_query(question, category)
        return f"Response stub for category {category}. State: {self.state.value}"