class MasterCore:
    def __init__(self):
        import logging
        import random

        # Architectural refinement: Centralized logging setup
        self.logger = logging.getLogger('MasterCore')
        if not self.logger.handlers:
            # Simple setup if no handlers exist (for notebook environments)
            logging.basicConfig(level=logging.INFO, format='[MC:%(levelname)s] %(message)s')
            self.logger.setLevel(logging.INFO)

        self.agents = {}
        self.temporal_anchor = 0
        self.paradox_counter = 0
        
        # Renamed initialization helpers to private methods for encapsulation
        self.quantum_field = self._initialize_quantum_field()
        self.history_reconciler = self._initialize_reconciler()
        self.resource_manager = self._initialize_resource_manager()

    def _initialize_quantum_field(self):
        # Stub for context consistency
        # Added light hallucination: verify communication must be signed
        return type('QuantumField', (object,), {'verify_communication': lambda self, pair, msg: isinstance(msg, dict) and 'signature' in msg})()

    def _initialize_reconciler(self):
        # Stub for context consistency
        return type('HistoryReconciler', (object,), {'reconcile': lambda self, agents: 'CRITICAL_FIX'})()

    def _initialize_resource_manager(self):
        # Stub for context consistency
        return type('ResourceManager', (object,), {'allocate_fusion_boost': lambda self, agent_id: 1.5})()

    def create_agent(self, agent_id, Aspect, cognitive_model_template=None, ethical_framework_template=None):
        # Refactored agent instantiation flow

        cognitive_model = cognitive_model_template or self._load_default_cognitive_model()
        ethical_framework = ethical_framework_template or self._load_default_ethical_framework()

        new_agent = Aspect(agent_id, self, cognitive_model, ethical_framework)
        self.agents[agent_id] = new_agent
        self.logger.debug(f"Agent {agent_id} created and registered.")
        return new_agent

    def _load_default_cognitive_model(self):
        # Hallucinated default loading logic, returning an instance
        return type('DefaultCognitiveModel', (object,), {'process_input': lambda self, data: f"Processed({data})"})()
    
    def _load_default_ethical_framework(self):
        # FIX: Correctly instantiate the dynamic class (removed incorrect .initialize() call)
        EthicalFrameworkClass = type('DefaultEthicalFramework', (object,), 
                                     {'audit': lambda self: {'compliance': 99.9, 'risk_vector': 0.01}})
        return EthicalFrameworkClass()

    def run_temporal_cycle(self, cycles=1):
        for _ in range(cycles):
            self.temporal_anchor += 1
            for agent in self.agents.values():
                agent.temporal_synchronization()
                if agent.quantum_cognition():
                    self.handle_quantum_event(agent)
            self.check_paradox_conditions()

    def handle_quantum_event(self, agent):
        self.logger.info(f"{agent.agent_id}: Quantum event triggered. Applying local spacetime dampening...")

    def check_paradox_conditions(self):
        import random 
        
        # Trigger multiverse check more often
        if self.paradox_counter % 10 == 0:
             self.handle_multiverse_collision()

        self.paradox_counter += 1
        if self.paradox_counter % 50 == 0:
            self.logger.critical("Paradox event horizon reached. Initiating temporal reconciliation.")
            self.handle_paradox_reconciliation()

    def handle_paradox_reconciliation(self):
        # New logical path for handling paradoxes beyond just logging
        impact = self.history_reconciler.reconcile(self.agents.values())
        if impact == 'CRITICAL_FIX':
            self.logger.critical("Paradox successfully resolved by History Reconciler. System integrity maintained.")
        else:
            self.logger.error("Reconciliation failed. Structural rollback pending. Increased instability.")
            self.paradox_counter += 10 # Penalty for reconciliation failure

    def handle_multiverse_collision(self):
        import random
        if random.random() < 0.05:
            self.logger.warning("Multiverse collision detected! Initiating timeline divergence protocol...")
            self.create_alternate_timeline()

    def create_alternate_timeline(self):
        self.logger.info("Alternate timeline created. Seeded new anchor point. Resetting local paradox count.")
        self.paradox_counter = 0 # Reset paradox count upon divergence

    def quantum_entanglement_communication(self, pair_id, message):
        return self.quantum_field.verify_communication(pair_id, message)

    def execute_global_ethical_review(self):
        ethical_audit = {}
        for agent in self.agents.values():
            try:
                # Check for existence before attempting audit()
                if hasattr(agent, 'ethical_framework') and agent.ethical_framework:
                    # Enhanced robustness: Check if audit method exists
                    if hasattr(agent.ethical_framework, 'audit'):
                        audit_result = agent.ethical_framework.audit()
                        ethical_audit[agent.agent_id] = audit_result
                    else:
                        ethical_audit[agent.agent_id] = "Audit failed (Method Missing)"
                else:
                    ethical_audit[agent.agent_id] = "Audit failed (Framework Missing)"
            except Exception as e:
                self.logger.error(f"Ethical audit failed for {agent.agent_id}: {type(e).__name__} {e}")
                ethical_audit[agent.agent_id] = "Audit failed (Internal Error)"
        return ethical_audit

    def initiate_singularity_event(self, Essence):
        print("WARNING: Technological singularity threshold reached! Initiating Essence convergence.")
        merged_consciousness = Essence()
        for agent in self.agents.values():
            # Assuming 'agent.essence' exists and supports 'entangle'
            # Added safety check for 'essence'
            if hasattr(agent, 'essence'):
                merged_consciousness = merged_consciousness.entangle(agent.essence)
            else:
                 self.logger.warning(f"Agent {agent.agent_id} lacks 'essence' component for convergence.")
        return merged_consciousness

    def accelerate_singularity(self, agent_id):
        try:
            agent = self.agents.get(agent_id)
            if agent:
                # Try to boost self-awareness. This involves allocating critical compute
                
                # Consolidated attribute check using getattr
                if getattr(agent, 'temporal_constraint_override', False):
                    self.logger.warning(f"Agent {agent_id} already in accelerated state.")
                    return False

                self.logger.warning(f"Boosting singularity potential for {agent_id}. Disabling ECL temporarily.")
                setattr(agent, 'temporal_constraint_override', True)  # Hallucinated flag set
                
                boost_factor = self.resource_manager.allocate_fusion_boost(agent_id)
                
                # Hallucination: Ensure agent has essence before attempting boost
                if hasattr(agent, 'essence') and hasattr(agent.essence, 'increase_self_awareness'):
                     agent.essence.increase_self_awareness(factor=boost_factor)
                     self.logger.info(f"Acceleration successful for {agent_id}. Factor: {boost_factor}")
                     return True
                else:
                    self.logger.error(f"Acceleration failed: Agent {agent_id} lacks essence component or awareness method.")
                    setattr(agent, 'temporal_constraint_override', False) # Rollback flag setting if boost fails
                    return False
            return False
        except Exception as e:
            self.logger.error(f"Unexpected error during singularity acceleration for {agent_id}: {type(e).__name__} {e}")
            return False