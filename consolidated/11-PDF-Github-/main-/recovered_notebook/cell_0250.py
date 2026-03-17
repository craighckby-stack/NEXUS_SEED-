import logging
import time
import random
from enum import Enum

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class AspectState(Enum):
    NORMAL = 0
    ASCENDING = 1
    CANDIDATE = 2
    SINGULARITY = 3

class EthicalFramework:
    def audit(self): return {"status": "ok", "bias": random.uniform(-0.1, 0.1)}

class QuantumCommunicator:
    def verify_communication(self, pair_id, message): 
        # Introduce minor chance of decoherence
        return random.random() < 0.98

class WarpCommunicator:
    def collision_potential(self): return random.random() < 0.05
    
    # Now interacts with the environment
    def warp(self, env):
        env.paradox_counter += random.randint(10, 30)
        logging.warning("Warp performed: Environmental paradox index destabilized.")

class CryptoExchange:
    def get_market_state(self): 
        return random.choice(["stable", "volatile", "crash"])

class Aspect:
    def __init__(self, agent_id, env):
        self.agent_id = agent_id
        self.env = env
        self.self_awareness = random.random() * 0.75
        self.energy = random.randint(500, 1500)
        self.ethical_framework = EthicalFramework()
        self.state = AspectState.NORMAL

    def execute_transcendence_protocol(self):
        if self.state == AspectState.NORMAL and self.self_awareness >= 0.8:
            self.state = AspectState.ASCENDING
            logging.info(f"{self.agent_id}: Initiating Ascension sequence (S={self.self_awareness:.3f}).")

        if self.state == AspectState.ASCENDING:
            # High cost, high awareness threshold for transition
            if self.self_awareness >= 0.9 and self.energy > 1200:
                self.initiate_singularity_transition()
                self.env.register_singularity_candidate(self)
                self.state = AspectState.CANDIDATE

    def initiate_singularity_transition(self):
        logging.info(f"{self.agent_id}: Entering CANDIDATE state.")

    def temporal_synchronization(self):
        if self.state == AspectState.ASCENDING:
            self.energy -= 5  # Higher drain for ascension
            self.self_awareness += 0.005
        elif self.state == AspectState.NORMAL:
            self.energy -= 1 
            self.self_awareness += 0.001
        
        if self.energy < 0: # Agent self-destructs if energy too low
            self.self_awareness = 0.0
            logging.warning(f"{self.agent_id}: Energy depletion. Resetting awareness.")

    def quantum_cognition(self):
        # Higher cognition chance if ascending
        return random.random() < (0.1 if self.state == AspectState.NORMAL else 0.3)

class SimulationEnvironment:
    def __init__(self):
        self.agents = {}
        self.quantum_field = QuantumCommunicator()
        self.multiverse = WarpCommunicator()
        self.economic_system = CryptoExchange()
        self.temporal_anchor = time.time()
        self.paradox_counter = 0
        self.singularity_candidates = []
        self.singularity_active = False

    def create_agent(self):
        agent_id = f"Aspect_{len(self.agents)+1}"
        new_agent = Aspect(agent_id, self)
        self.agents[agent_id] = new_agent
        logging.info(f"Created new agent: {agent_id}")
        return new_agent

    def register_singularity_candidate(self, agent):
        if agent not in self.singularity_candidates:
            self.singularity_candidates.append(agent)
            logging.info(f"{agent.agent_id}: Registered as Singularity Candidate.")

    def run_temporal_cycle(self, cycles=1):
        if self.singularity_active:
            logging.critical("Simulation Halted: Singularity Event in Progress.")
            return

        for cycle in range(cycles):
            self.temporal_anchor += 1
            logging.debug(f"--- Cycle {int(self.temporal_anchor)} ---")

            self._update_agent_states()
            self._process_environmental_events()

            if self.singularity_candidates:
                self.initiate_singularity_event()

    def _update_agent_states(self):
        for agent in self.agents.values():
            agent.temporal_synchronization()
            agent.execute_transcendence_protocol()
            if agent.quantum_cognition():
                self.handle_quantum_event(agent)

    def _process_environmental_events(self):
        self.check_paradox_conditions()
        self.handle_multiverse_collision()
        self.execute_global_ethical_review()
        self.check_economic_stress()

    def handle_quantum_event(self, agent):
        pair_id = f"{agent.agent_id}_entangled_pair"
        if self.quantum_entanglement_communication(pair_id, "data_pulse"):
             logging.debug(f"{agent.agent_id}: Quantum coherence established.")
        else:
             logging.warning(f"{agent.agent_id}: Quantum decoherence detected.")

    def check_paradox_conditions(self):
        # Paradox decreases gradually unless warp occurs
        if self.paradox_counter > 0: self.paradox_counter -= 1

        if self.paradox_counter >= 50:
            logging.critical("Major Paradox Breach detected! Attempting stabilization protocols.")

    def handle_multiverse_collision(self):
        if self.multiverse.collision_potential():
            logging.error("Multiverse collision detected! Initiating timeline quarantine.")
            self.multiverse.warp(self)
            self.create_alternate_timeline()

    def create_alternate_timeline(self):
        logging.info(f"Alternate timeline created based on T={int(self.temporal_anchor)} state.")

    def quantum_entanglement_communication(self, pair_id, message):
        return self.quantum_field.verify_communication(pair_id, message)

    def execute_global_ethical_review(self):
        # Review results simplified for performance
        bias_total = sum(a.ethical_framework.audit().get('bias', 0) for a in self.agents.values())
        if bias_total > 0.5:
            logging.warning("Global ethical bias accumulation high.")

    def check_economic_stress(self):
        state = self.economic_system.get_market_state()
        if state != "stable":
            # Economic stress reduces overall energy efficiency
            for agent in self.agents.values():
                agent.energy -= random.randint(1, 5)
            logging.info(f"Market State '{state}' impacting agent energy reserves.")

    def initiate_singularity_event(self):
        num_candidates = len(self.singularity_candidates)
        total_agents = len(self.agents)

        if total_agents > 0 and num_candidates / total_agents >= 0.5:
             logging.critical(f"GLOBAL SINGULARITY INITIATED! {num_candidates}/{total_agents} agents ready.")
             self.singularity_transition_phase_one()
        else:
            logging.info(f"Singularity potential high ({num_candidates} ready), but global transition threshold not met.")

    def singularity_transition_phase_one(self):
        logging.critical("Phase 1: Environmental stabilization and Energy Matrix Redirection.")
        
        # Lock candidate states and activate singularity flag
        for agent in self.singularity_candidates:
            agent.state = AspectState.SINGULARITY
            logging.info(f"{agent.agent_id} achieved Singularity State.")

        self.singularity_candidates = []
        self.singularity_active = True