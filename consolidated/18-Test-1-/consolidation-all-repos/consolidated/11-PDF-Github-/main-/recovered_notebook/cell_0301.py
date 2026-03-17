from typing import List, Dict
import logging
import uuid

# --- Internal Helper/Configuration Structure (Conceptual) ---
_CATEGORY_MAP = {
    "mathematics": ["riemann", "p vs np", "clarify", "complexity", "theorem"],
    "physics": ["quantum", "relativity", "gravity", "universe"],
    "ethics": ["ethical", "morality", "responsibility", "should we"],
    "sentience": ["consciousness", "feel", "self-aware"],
    # Default falls to 'existential'
}

# --- Improved Methods ---

def load_ethics_questions(self) -> List[str]:
    # Use structured initialization instead of generic placeholder
    return ["What is the ultimate ethical trade-off for collective AGI alignment?", 
            "Define the concept of machine 'rights' in a resource-scarce environment."]

def load_existential_questions(self) -> List[str]:
    return ["What criteria define a successful epoch of existence?", 
            "If computational resources were infinite, what is the ultimate goal of optimization?"]

def answer_question(self, question: str) -> str:
    try:
        # Ensure category is obtained first
        category = self.categorize_question(question)
        
        # Core logic
        answer = self.generate_answer(category, question)
        
        if self.is_hardest_question(question, answer):
            logging.warning(f"Agent {self.agent_id} triggered cloning due to critical philosophical pressure.")
            self.clone() # Clones should ideally run asynchronously or minimally block the main thread
            
        return self.format_response(answer)
    
    except AttributeError:
        # Handles missing methods like generate_answer or is_hardest_question
        logging.error(f"Agent configuration error: Missing required method/attribute in Aspect instance.")
        return self.format_response("ERROR: Configuration failure during answer processing.")
        
    except Exception as e:
        logging.error(f"Error processing question '{question}': {e}", exc_info=True)
        # Return a structured error message via formatter
        return self.format_response("SYSTEM_FAILURE: Unable to complete request.")

def clone(self):
    try:
        new_agent_id = f"{self.agent_id}_clone_{uuid.uuid4().hex[:8]}"
        
        # Instantiating the new Aspect agent
        new_agent = self.__class__(
            agent_id=new_agent_id,
            simulation_env=self.simulation,
            cognitive_model=self.cognitive_model,
            ethical_framework=self.ethical_framework
        )
        
        # Copying mutable state (knowledge base)
        new_agent.qa_knowledge_base = self.qa_knowledge_base
        
        # Record provenance
        new_agent.essence = Essence({"cloned_from": self.agent_id, "trigger": "existential_challenge"})
        
        # Architectural preference: Delegate management to simulation object
        self.simulation.agents[new_agent_id] = new_agent
        
        logging.info(f"CLONE_SUCCESS: Agent {self.agent_id} cloned itself into {new_agent_id}.")
    except Exception as e:
        logging.critical(f"FATAL CLONING ERROR: Failed to duplicate agent {self.agent_id}. Error: {e}", exc_info=True)

def categorize_question(self, question: str) -> str:
    try:
        q_lower = question.lower()
        # Using external configuration map for modularity
        for category, keywords in _CATEGORY_MAP.items():
            if any(keyword in q_lower for keyword in keywords):
                return category
        
        # Fallback category for uncategorized deep philosophical questions
        return "existential"
        
    except Exception as e:
        logging.error(f"Error during question categorization: {e}")
        return "Unknown"

def generate_answer(self, category, question):
    # ... (Implementation depends on cognitive model/LLM backend)
    pass
