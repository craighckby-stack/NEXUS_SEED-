import copy
import logging
import uuid

# Assuming Aspect, Essence, categorize_question, generate_answer, 
# is_hardest_question, and format_response are defined methods/classes

# --- Constants for Configuration ---
_DEFAULT_QUESTIONS = [
    "AI, EXPLAIN QUANTUM ENTANGLEMENT.", 
    "AI, WHAT IS RELATIVITY?"
]
_DEFAULT_ETHICS = [
    "AI, IS IT ETHICAL TO ... ?"
]
_DEFAULT_EXISTENTIAL = [
    "AI, WHAT IS THE MEANING OF LIFE?"
]

class Aspect:
    # Assuming __init__ handles simulation_env, cognitive_model, etc.
    
    def questions(self):
        return _DEFAULT_QUESTIONS

    def load_ethics_questions(self):
        return _DEFAULT_ETHICS

    def load_existential_questions(self):
        return _DEFAULT_EXISTENTIAL

    def answer_question(self, question):
        if hasattr(self, 'action_cooldown') and self.action_cooldown > 0:
            logging.info(f"{self.agent_id} is on cooldown.")
            return "I am on cooldown."

        try:
            category = self.categorize_question(question)
            answer = self.generate_answer(category, question)
            
            # Decoupled decision logic for replication
            if self.is_hardest_question(question, answer):
                logging.info(f"Triggering replication attempt for {self.agent_id}.")
                self._attempt_replication()
                
            # Standard cooldown for basic action (even if replication fails/succeeds)
            self.action_cooldown = 1
            return self.format_response(answer)
        
        except Exception as e:
            logging.error(f"Error during answering question for {self.agent_id}: {e}")
            # Ensure cooldown is not set if the core logic fails completely
            # (Assuming self.action_cooldown is managed upon successful action start/end)
            return "Error during answering question"

    def _attempt_replication(self):
        if hasattr(self, 'action_cooldown') and self.action_cooldown > 0:
            logging.warning(f"Replication attempt aborted. {self.agent_id} on cooldown.")
            return
        
        # High-cost operation - set cooldown immediately
        self.action_cooldown = 5 # Increased cooldown for high-energy state change
        
        try:
            new_agent_id = f"{self.agent_id}_clone_{uuid.uuid4().hex[:6]}"
            
            # 1. Instantiate the new aspect
            new_agent = self.__class__(
                agent_id=new_agent_id, 
                simulation_env=self.simulation, 
                cognitive_model=self.cognitive_model,
                ethical_framework=self.ethical_framework
            )
            
            # 2. Deep copy the mutable knowledge base for independent evolution
            new_agent.qa_knowledge_base = copy.deepcopy(self.qa_knowledge_base)
            
            # 3. Create a new essence and initialize clone metadata
            new_agent.essence = Essence({"cloned_from": self.agent_id, "generation": self.essence.get('generation', 0) + 1})
            
            # 4. Finalize creation
            self.simulation.agents[new_agent_id] = new_agent
            logging.critical(f"Agent {self.agent_id} successfully cloned itself! New agent: {new_agent_id}")
            
            # 5. Resource Penalty (stability reduction)
            self.essence.temporal_stability = self.essence.get('temporal_stability', 1.0) * 0.9
            
        except Exception as e:
            logging.error(f"Critical failure during cloning of {self.agent_id}: {e}")
            # If cloning fails, reset the high cooldown, allowing quick recovery
            self.action_cooldown = 1 # Small penalty for failed attempt

