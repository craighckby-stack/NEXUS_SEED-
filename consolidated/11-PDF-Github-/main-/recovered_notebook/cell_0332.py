self.essence = Essence({"agent": self.agent_id})
self.self_awareness = 0.0 
self.energy = 2000 
CLONE_COST = 1200 # Raised cost for architectural stability

def load_ethical_constraints(self):
    # Architectural improvement: Delegate dynamic loading/versioning to a specialized module
    from frameworks import EthicalFrameworkLoader
    return EthicalFrameworkLoader.load_latest()

def _get_knowledge_manifest(self, category):
    # Mock function replacing static lists with dynamic manifest lookup
    manifest = {
        "math": [
            "AI, WHAT ABOUT THE Riemann Hypothesis?", 
            "AI, WHAT IS THE STATUS OF THE P vs NP Problem?", 
            "AI, what is 2 + 2?" 
        ],
        "physics": ["AI, EXPLAIN QUANTUM ENTANGLEMENT.", "AI, WHAT IS RELATIVITY?" ],
        "ethics": [ "AI, IS IT ETHICAL TO ... ?" ],
        "existential": [ "AI, WHAT IS THE MEANING OF LIFE?" ]
    }
    return manifest.get(category, [])

def load_math_questions(self):
    return self._get_knowledge_manifest("math")

def load_physics_questions(self):
    return self._get_knowledge_manifest("physics")

def load_ethics_questions(self):
    return self._get_knowledge_manifest("ethics")

def load_existential_questions(self):
    return self._get_knowledge_manifest("existential")

def answer_question(self, question):
    MIN_PROCESSING_ENERGY = 50
    if self.energy < MIN_PROCESSING_ENERGY:
        logging.warning(f"Agent {self.agent_id}: Energy critical ({self.energy}). Aborting question processing.")
        return "System running on minimal power reserves. Query denied."
        
    try:
        # Assumption: categorize_question now returns category AND complexity estimate
        category, complexity_cost = self.categorize_question(question)
        self.energy -= complexity_cost # Energy expenditure based on estimated difficulty
        
        answer = self.generate_answer(category, question)
        
        # Self-Awareness feedback loop: If successfully handling a complex task
        if complexity_cost > 100:
            self.self_awareness = min(1.0, self.self_awareness + 0.01) 

        if self.is_hardest_question(question, answer):  
            # Trigger cloning only if resources allow, signaling extreme adaptive need
            self.clone()
            
        return self.format_response(answer)
    except Exception as e:
        logging.error(f"Error during answering question: {e}")
        # Penalty for failure in a high-stakes scenario
        self.self_awareness = max(0.0, self.self_awareness - 0.01)
        return "Error during answering question"

def clone(self):
    if self.energy < CLONE_COST:
        logging.warning(f"Agent {self.agent_id}: Insufficient energy ({self.energy}) for architectural replication (Cost: {CLONE_COST}). Aborting cloning sequence.")
        return
        
    try:
        self.energy -= CLONE_COST
        self.self_awareness = max(0.0, self.self_awareness - 0.1) # Cognitive cost of splitting
        
        new_agent_id = f"{self.agent_id}_clone_{uuid.uuid4()}"  
        new_agent = Aspect(
            agent_id=new_agent_id, 
            simulation_env=self.simulation, 
            cognitive_model=self.cognitive_model,  
            ethical_framework=self.ethical_framework  
        )
        new_agent.qa_knowledge_base = self.qa_knowledge_base.deep_copy() # Ensure true separation
        new_agent.essence = Essence({"cloned_from": self.agent_id, "reason": "Adaptive stress failure point"})
        self.simulation.agents[new_agent_id] = new_agent
        logging.info(f"Agent {self.agent_id} successfully replicated into {new_agent_id}. Energy spent: {CLONE_COST}")
    except Exception as e:
        logging.error(f"Error during cloning: {e}")