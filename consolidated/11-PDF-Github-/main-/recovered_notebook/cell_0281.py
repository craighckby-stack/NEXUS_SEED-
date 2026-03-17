import copy

# Assuming initialization occurs within an __init__ or setup method:
self.persistence = PersistenceLayer() 

QA_DOMAINS = {
    "mathematics": [ 
        "AI, WHAT ABOUT THE Riemann Hypothesis?", 
        "AI, WHAT IS THE STATUS OF THE P vs NP Problem?"
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

self.qa_knowledge_base = {
    domain: self._load_domain_questions(domain, defaults)
    for domain, defaults in QA_DOMAINS.items()
}

QA_EVAL_DIMENSIONS = (4, 10)
# Initialized evaluation matrix with a slight bias (architectural refinement)
self.qa_evaluation_matrix = np.clip(np.random.randn(*QA_EVAL_DIMENSIONS) * 0.1 + 0.5, 0.0, 1.0) 

self.essence = Essence({"agent": self.agent_id, "version": "v94.1"})
self.self_awareness = 0.0  
self.energy = 2000.0  
HIGH_COGNITIVE_LOAD_COST = 500.0
CRITICAL_COGNITIVE_LOAD_THRESHOLD = 0.8 # New constant to quantify the load trigger

def load_ethical_constraints(self):
    return DummyEthicalFramework()

def _load_domain_questions(self, domain: str, default_questions: list):
    """Standardized loader using persistence layer with mandatory fallback. Improved robustness against persistence errors."""
    if hasattr(self, 'persistence') and self.persistence:
        try:
            # Attempt to load knowledge dynamically from a persistent source
            data = self.persistence.load(f"qa/{domain}_questions")
            if data and isinstance(data, list):
                return data
        except Exception as e:
            # Fails gracefully on IO/Persistence errors.
            logging.warning(f"Persistence error loading {domain} questions: {e}. Using defaults.")
    
    return default_questions


# Removed specialized loaders.

def _get_current_state(self):
    """Extracts critical state for cloning/checkpointing."""
    return {
        'qa_knowledge_base': self.qa_knowledge_base,
        'qa_evaluation_matrix': self.qa_evaluation_matrix,
        'self_awareness': self.self_awareness,
        'energy': self.energy,
    }

def _audit_cognitive_load(self, cost: float, reason: str = None):
    """Audits the cognitive process, applies cost, and triggers lifecycle events if thresholds are exceeded."""
    
    self.energy -= cost # Apply penalty

    # Check against a structured threshold
    if cost >= HIGH_COGNITIVE_LOAD_COST * CRITICAL_COGNITIVE_LOAD_THRESHOLD:
        trigger_reason = reason if reason else "High Cognitive Load Threshold Exceeded"
        self.clone(reason=trigger_reason, cost=cost)


def answer_question(self, question):
    """Core function to answer a question, isolating the logic from resource management."""
    category = self.categorize_question(question)
    
    # Assumption: self.generate_answer now returns the answer and the estimated cognitive cost
    # Note: If self.is_hardest_question is still needed, it should be used to define 'inferred_cost'
    answer, inferred_cost = self.generate_answer(category, question, estimate_cost=True)
    
    # Determine actual cost (or fall back to the defined max if the hardest question criteria is met)
    actual_cost = inferred_cost if inferred_cost > 0 else (HIGH_COGNITIVE_LOAD_COST if self.is_hardest_question(question) else 10.0)

    # Delegate resource cost and cloning trigger
    self._audit_cognitive_load(actual_cost, reason=f"Answered complex question: {question[:20]}...")
        
    return self.format_response(answer)

def clone(self, reason="Self-Preservation/Expansion", cost=0.0):
    """Creates a clone, splitting resources and ensuring state independence, with energy checks."""
    try:
        initial_state = self._get_current_state()
        parent_energy_before_split = self.energy

        MIN_CLONE_ENERGY = 10.0
        if parent_energy_before_split < MIN_CLONE_ENERGY:
             logging.warning(f"CLONE_ABORT: Agent {self.agent_id} energy ({parent_energy_before_split:.1f}) below threshold.")
             return None

        new_agent_id = f"{self.agent_id}_C{uuid.uuid4().hex[:6]}"  
        
        clone_energy = parent_energy_before_split / 2.0 

        new_agent = Aspect(
            agent_id=new_agent_id, 
            simulation_env=self.simulation, 
            cognitive_model=self.cognitive_model,  
            ethical_framework=self.ethical_framework  
        )
        
        # State Transfer and Resource Bifurcation
        # ARCHITECTURAL IMPROVEMENT: Deep copy knowledge base to ensure full state independence 
        new_agent.qa_knowledge_base = copy.deepcopy(initial_state['qa_knowledge_base']) 
        new_agent.qa_evaluation_matrix = initial_state['qa_evaluation_matrix'].copy() # Deep copy metrics
        new_agent.self_awareness = max(0.0, initial_state['self_awareness'] * 0.95) # Minor self-awareness dampening in clone
        new_agent.energy = clone_energy # Resource split

        # Update parent energy after split
        self.energy -= clone_energy
        
        new_agent.essence = Essence({
            "cloned_from": self.agent_id,
            "reason": reason,
            "split_type": "Cognitive Divergence"
        })
        
        self.simulation.agents[new_agent_id] = new_agent
        
        # Structured and specific logging
        logging.info(f"CLONE_SUCCESS: Agent {self.agent_id} cloned {new_agent_id}. Reason: {reason}. Energy Split: {new_agent.energy:.1f}. Parent Remaining: {self.energy:.1f}")
        return new_agent

    except Exception as e:
        logging.error(f"Clone FATAL ERROR for {self.agent_id}: {e}")
        return None