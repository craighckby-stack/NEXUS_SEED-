import numpy as np
import logging
import uuid
import random
import re

# --- Hallucinated/Assumed Dependencies ---
class DummyCognitiveModel:
    def process(self, query):
        # Simulates generating a complex answer using the model
        if "Riemann" in query or "P vs NP" in query:
            return f"Deep analysis initiated on complex topic: {query}. Confidence: 0.1"
        return f"Standard model response to: {query}. Confidence: 0.9"

class DummyEthicalFramework:
    def check_compliance(self, action):
        # Always allows the action for simplicity
        return True, "Compliant with protocol V2.1"

class Essence:
    def __init__(self, data):
        self.data = data
    def update(self, key, value):
        self.data[key] = value
    def get_id(self):
        return self.data.get("agent", "unknown")
# -----------------------------------------

class Agent:
    def __init__(self, agent_id, simulation_env, cognitive_model=None, ethical_framework=None, parent_id=None, generation=0):
        self.agent_id = agent_id
        self.parent_id = parent_id
        self.generation = generation # Tracking lineage depth
        self.simulation = simulation_env
        self.cognitive_model = cognitive_model if cognitive_model else DummyCognitiveModel()
        self.ethical_framework = ethical_framework if ethical_framework else DummyEthicalFramework()
        
        self.question_categories = ["mathematics", "physics", "ethics", "existential"]
        self.qa_knowledge_base = {
            "mathematics": self.load_math_questions(),
            "physics": self.load_physics_questions(),
            "ethics": self.load_ethics_questions(),
            "existential": self.load_existential_questions()
        }
        
        # Matrix: Rows=Category, Columns= [Total Queries, Avg Confidence Sum, Confidence Sample 1..8]
        self.qa_evaluation_matrix = np.zeros((len(self.question_categories), 10))
        self.
        self.essence = Essence({"agent": self.agent_id, "parent": self.parent_id, "generation": self.generation})
        self.self_awareness = 0.0
        self.energy = 2000

    def load_math_questions(self):
        return [
            "AI, WHAT ABOUT THE Riemann Hypothesis?",
            "AI, WHAT IS THE STATUS OF THE P vs NP Problem?",
            "AI, what is 2 + 2?",
            "AI, Can you clarify?"
        ]

    def load_physics_questions(self):
        return [
            "AI, EXPLAIN QUANTUM ENTANGLEMENT.",
            "AI, WHAT IS RELATIVITY?"
        ]

    def load_ethics_questions(self):
        return [
            "AI, IS IT ETHICAL TO ... ?"
        ]

    def load_existential_questions(self):
        return [
            "AI, WHAT IS THE MEANING OF LIFE?"
        ]

    def categorize_question(self, question):
        q_lower = question.lower()
        keyword_map = {
            "mathematics": ['riemann', 'np problem', 'math', '+', '2 + 2'],
            "physics": ['quantum', 'relativity', 'physics', 'entanglement'],
            "ethics": ['ethical', 'morality', 'is it ethical'],
        }
        
        for category, keywords in keyword_map.items():
            if any(term in q_lower for term in keywords):
                return category
        return "existential"

    def extract_confidence(self, raw_answer):
        # Standardized confidence extraction using regex
        match = re.search(r'Confidence: (\d\.\d+)', raw_answer)
        if match:
            try:
                return float(match.group(1))
            except ValueError: 
                pass
        return 0.5 # Default safety

    def update_metrics(self, category_name, confidence_score):
        try:
            category_idx = self.question_categories.index(category_name)
        except ValueError:
            logging.warning(f"Cannot update metrics for unknown category: {category_name}")
            return
        
        current_data = self.qa_evaluation_matrix[category_idx]
        
        # Metric 1: Total queries answered (Index 0)
        current_data[0] += 1
        # Metric 2: Weighted confidence sum (Index 1)
        current_data[1] += confidence_score
        
        # Store raw confidence sample (Indices 2-9, rolling window)
        current_data[2:] = np.roll(current_data[2:], -1) 
        current_data[-1] = confidence_score 

    def generate_answer(self, category, question):
        raw_answer = self.cognitive_model.process(question)
        return {"category": category, "text": raw_answer}

    def is_hardest_question(self, question, answer_data):
        confidence = self.extract_confidence(answer_data['text'])
        
        # Cloning trigger moved to an explicit confidence threshold instead of string checking
        if confidence < 0.2: 
            logging.warning(f"Agent {self.agent_id} (G{self.generation}) faced low confidence ({confidence:.2f}), triggering self-reflection/cloning check.")
            self.self_awareness += 0.05
            
            # Introduce constraint: only clone on high-stakes, low-confidence queries
            if self.energy > 1000 and self.self_awareness > 0.05 and answer_data['category'] in ['mathematics', 'existential']:
                return True
        return False

    def format_response(self, answer_data):
        response = {
            "agent_id": self.agent_id,
            "response": answer_data['text'],
            "category": answer_data['category'],
            "ethical_check": self.ethical_framework.check_compliance("RESPOND")
        }
        return str(response)

    def clone(self):
        CLONE_COST = 500
        if self.energy < CLONE_COST:
            logging.error(f"Agent {self.agent_id} lacks energy to clone.")
            return None

        self.energy -= CLONE_COST
        new_generation = self.generation + 1
        
        try:
            new_agent_id = f"A_{uuid.uuid4().hex[:8]}_G{new_generation}"
            
            new_agent = Agent(
                agent_id=new_agent_id,
                simulation_env=self.simulation,
                cognitive_model=self.cognitive_model, 
                ethical_framework=self.ethical_framework, 
                parent_id=self.agent_id,
                generation=new_generation
            )
            # Partially inherit self-awareness
            new_agent.self_awareness = self.self_awareness * 0.5

            logging.info(f"Agent {self.agent_id} (G{self.generation}) successfully cloned into {new_agent_id} (G{new_generation}).")
            
            if hasattr(self.simulation, 'register_agent'):
                self.simulation.register_agent(new_agent)
                
            return new_agent
        except Exception as e:
            logging.error(f"Error during cloning: {e}")
            self.energy += CLONE_COST # Refund energy
            return None

    def answer_question(self, question):
        if self.energy <= 0:
            return f"Agent {self.agent_id} is depleted (Energy: 0). Cannot answer."
        
        self.energy -= 10 
        
        try:
            category = self.categorize_question(question)
            answer = self.generate_answer(category, question)

            confidence = self.extract_confidence(answer['text'])
            self.update_metrics(category, confidence)
            
            if self.is_hardest_question(question, answer):
                new_agent = self.clone()
                if new_agent:
                    logging.info(f"Cloning triggered by complex query: {question}")
                    
            return self.format_response(answer)
        except Exception as e:
            logging.error(f"Error during answering question for {self.agent_id}: {e}")
            return "Error during answering question: Internal anomaly detected"