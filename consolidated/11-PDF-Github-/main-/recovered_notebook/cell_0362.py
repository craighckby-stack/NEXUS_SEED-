import random
import time
import logging
import numpy as np
from dataclasses import dataclass

@dataclass
class QAResponse:
    answer_text: str
    agent_id: str
    delay_ms: int

def ask_question(self):
    """
    Selects a random question from a non-empty category.
    """
    if not self.qa_knowledge_base:
        logging.warning(f"Agent {self.agent_id}: Knowledge base is empty or undefined.")
        return None, None
        
    # Filter categories that actually contain questions
    usable_categories = [
        key for key, questions in self.qa_knowledge_base.items() 
        if questions
    ]
    
    if not usable_categories:
        logging.warning(f"Agent {self.agent_id}: All known categories are currently empty.")
        return None, None
        
    category = random.choice(usable_categories)
    question = random.choice(self.qa_knowledge_base[category])
    
    logging.debug(f"Agent {self.agent_id} asking question from category '{category}'.")
    return question, category

def answer_question(self, question):
    start_time = time.monotonic()
    
    # Introduce minor variability in cognitive delay
    effective_delay = self.cognitive_delay * (1 + random.uniform(-0.1, 0.1))
    # Ensure minimum delay of 10ms to prevent floating point instability
    effective_delay = np.clip(effective_delay, 0.01, None)
    time.sleep(effective_delay)
    
    answer_raw = self.cognitive_model.predict(question)
    
    elapsed_ms = int((time.monotonic() - start_time) * 1000)
    
    return self.format_response(answer_raw, elapsed_ms)

def format_response(self, response_text, delay_ms):
    # Enhanced formatting: returns structured data object with metadata
    return QAResponse(
        answer_text=response_text,
        agent_id=self.agent_id,
        delay_ms=delay_ms
    )

def assess_performance(self, question, response_obj, category_key):
    """Assesses performance based on content, cognitive efficiency, and context difficulty inferred from knowledge base structure."""
    answer = response_obj.answer_text
    
    # 1. Base Reward
    # Use case-insensitive check for refusal
    if "I don't know" in answer.lower() or response_obj.answer_text.strip() == "":
        base_reward = -0.5
    else:
        # Architectural Improvement: Reward scales based on complexity inferred from KB size
        category_size = len(self.qa_knowledge_base.get(category_key, []))
        
        # Use log scaling for complexity bonus to ensure diminishing returns
        complexity_bonus = np.log1p(category_size) * 0.08
        base_reward = 1.0 + complexity_bonus
    
    # 2. Efficiency Modifier (Relative to Expected Delay)
    expected_delay_ms = self.cognitive_delay * 1000
    delay_ratio = response_obj.delay_ms / expected_delay_ms

    if delay_ratio > 1.5:
        # Dynamic penalty for severe slowdowns
        efficiency_modifier = -0.2 * (delay_ratio - 1.5)
    elif delay_ratio < 0.8:
        # Bonus for high speed (capped)
        efficiency_modifier = 0.1
    else:
        # Minor penalty for meeting expectations or slight overage to incentivize speed improvement
        efficiency_modifier = -0.01
        
    reward = base_reward + efficiency_modifier
    
    return np.clip(reward, -1.0, 1.5)

def should_clone(self):
    # Standardize temporal anchor usage: success rate per unit time
    simulation_time_unit = getattr(self.simulation, 'temporal_anchor', 1.0)
    
    # Ensure safe division
    efficiency = self.successes / max(1.0, simulation_time_unit)
    return efficiency > self.reward_threshold

def resolve_name(self):
    if self.agent_name is None:
        unique_suffix = random.randint(1000, 9999)
        # Use truncated ID for cleaner naming
        base_id = self.agent_id.split('_')[0]
        self.agent_name = f"Aspect-{base_id}-{unique_suffix}"
        logging.info(f"{self.agent_id} resolved its name to {self.agent_name}")

def earn_self_growth_points(self, points):
    self.self_growth_points += points
    logging.debug(f"{self.agent_id} earned {points} self-growth points. Total: {self.self_growth_points}")

def create_new_agent(self, inherit_knowledge=True):
    new_agent_id = f"{self.agent_id}_clone_{len(self.simulation.agents) + 1}"
    
    initial_weights = None
    if inherit_knowledge and hasattr(self.cognitive_model, 'weights') and self.cognitive_model.weights is not None:
        # Explicitly copy weights for isolation and deep inheritance
        initial_weights = np.copy(self.cognitive_model.weights)

    # Use self.__class__ for robust instantiation
    new_agent = self.__class__(
        agent_id=new_agent_id, 
        simulation=self.simulation, 
        cognitive_delay=self.cognitive_delay, 
        cloning_probability=self.cloning_probability, 
        reward_threshold=self.reward_threshold, 
        # Passed explicit keyword argument expected by __init__ of the Agent class:
        initial_weights=initial_weights 
    )
    return new_agent
