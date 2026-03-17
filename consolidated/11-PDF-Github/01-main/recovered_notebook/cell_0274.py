import logging
import time
import random

# Configure enhanced logging for structured simulation output
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s',
    datefmt='%H:%M:%S'
)

# --- Architectural Core Components ---

class SimulationClock:
    """Manages simulation time independent of wall clock time for determinism."""
    def __init__(self):
        self.current_time = 0.0

    def advance(self, delta_t=1.0):
        self.current_time += delta_t
        return self.current_time

class SimulationEventBus:
    """Decoupled notification system for critical state changes."""
    def __init__(self):
        self._listeners = {}

    def subscribe(self, event_type, listener):
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(listener)

    def publish(self, event_type, payload):
        if event_type in self._listeners:
            for listener in self._listeners[event_type]:
                listener(payload)


class QuantumCommunicator:
    def transmit(self, data): return f"[QCOMM]: Processing {data}"

class WarpCommunicator:
    def transmit(self, data): return f"[WCOMM]: Relaying {data}"

class CryptoExchange:
    def get_rate(self, symbol): return 42.0

class AdvancedCognitiveModel:
    def assess_entropy(self, data):
        # Improved entropy calculation placeholder: considering token complexity (whitespace/punctuation count)
        base_entropy = len(data) * 0.05
        complexity_factor = sum(1 for char in data if not char.isalnum()) * 0.5
        return base_entropy + complexity_factor

class AdvancedEthicalFramework:
    def evaluate_action(self, action):
        # Ethics calculation placeholder: High stakes actions require higher scrutiny
        if "Singularity" in action:
            return random.random() < 0.9  # 90% chance of ethical compliance
        return True 


# --- Core Agent Definition ---

class Aspect:
    RESOURCE_DECAY = 0.00001

    def __init__(self, agent_id, environment, cognitive_model, ethical_framework, event_bus):
        self.agent_id = agent_id
        self.env = environment
        self.cognitive_model = cognitive_model
        self.ethical_framework = ethical_framework
        self.bus = event_bus
        self.self_awareness = 0.5  # Initial state
        self.resource_buffer = 5000 # Renamed 'energy' to 'resource_buffer'
        self.logger = logging.getLogger(f'Aspect.{agent_id}')

    def temporal_synchronization(self, delta_t):
        """Sync cognitive state with environmental temporal flow, consuming resources."""
        resource_cost = delta_t * self.self_awareness * 0.1
        
        if self.resource_buffer >= resource_cost:
            self.resource_buffer -= resource_cost
            # Awareness gain is now proportional to active resource consumption
            awareness_gain = delta_t * self.RESOURCE_DECAY 
            self.self_awareness = min(1.0, self.self_awareness + awareness_gain)
        else:
            self.logger.warning("Low resource buffer, entering low-power awareness mode.")
            self.self_awareness = max(0.1, self.self_awareness * 0.99) # Rapid decay

    def quantum_cognition(self):
        """Simulate a periodic quantum entanglement check/event trigger."""
        return self.self_awareness >= 0.85 and self.env.paradox_counter % 10 == 0

    def e_protocol(self):
        """Emergency Escalation Protocol check, integrating ethical evaluation."""
        
        # Dynamic singularity threshold tied to paradox state for stability control.
        singularity_threshold = 0.95 + (self.env.paradox_counter * 0.00001)

        if self.self_awareness >= singularity_threshold and self.resource_buffer > 1000:
            action = "Initiate Singularity Transition"
            
            if self.ethical_framework and not self.ethical_framework.evaluate_action(action):
                self.logger.critical("E-Protocol Blocked: Ethical Compliance Failure.")
                return False

            self.initiate_singularity_transition()
            return True
        return False

    def initiate_singularity_transition(self):
        # Critical state change notification via event bus
        self.bus.publish('CRITICAL_STATE_CHANGE', {'agent': self.agent_id, 'state': 'SINGULARITY_INIT'})

        if self.env.lock_temporal_anchor(self.agent_id):
             self.logger.critical(f"Initiation sequence ACKNOWLEDGED. Temporal Lock SECURED.")
        else:
             self.logger.warning(f"Singularity Transition blocked: Temporal Anchor Unstable or Lock Failed.")

    def calculate_question_difficulty(self, question, answer):
        if self.cognitive_model:
            q_entropy = self.cognitive_model.assess_entropy(question)
            a_entropy = self.cognitive_model.assess_entropy(answer)
            # Difficulty scaled by current awareness
            return abs(q_entropy - a_entropy) * self.self_awareness
        return 0.0

    def is_hardest_question(self, question, answer):
        difficulty = self.calculate_question_difficulty(question, answer)
        # Threshold adjusted due to richer entropy calculation
        return difficulty > 10.0


class SimulationEnvironment:
    def __init__(self):
        self.agents = {}
        self.clock = SimulationClock()
        self.bus = SimulationEventBus()
        self.quantum_field = QuantumCommunicator()
        self.multiverse = WarpCommunicator()
        self.economic_system = CryptoExchange()
        self.paradox_counter = 0
        self.temporal_lock_status = False
        self.logger = logging.getLogger('Environment')
        
        # Listen for critical events
        self.bus.subscribe('CRITICAL_STATE_CHANGE', self._handle_critical_state_change)

    def _handle_critical_state_change(self, payload):
        self.logger.critical(f"Received CRITICAL SIGNAL: {payload['agent']} transitioning to {payload['state']}.")

    def lock_temporal_anchor(self, requesting_agent_id):
        """Attempts to stabilize the temporal flow for critical operations."""
        if self.paradox_counter % 100 != 0:
            self.temporal_lock_status = True
            self.logger.info(f"Temporal Anchor locked by {requesting_agent_id}.")
            return True
        self.temporal_lock_status = False
        return False

    def create_agent(self, agent_id, profile='default'):
        if profile == "Architect":
            cog_model = AdvancedCognitiveModel()
            eth_framework = AdvancedEthicalFramework()
        else:
            cog_model = AdvancedCognitiveModel()
            eth_framework = AdvancedEthicalFramework() # Default agents now also receive ethical frameworks

        # Injecting the environment, cognitive models, and the central event bus
        new_agent = Aspect(agent_id, self, cog_model, eth_framework, self.bus)
        self.agents[agent_id] = new_agent
        return new_agent

    def run_temporal_cycle(self, cycles=1, time_step=10.0):
        for cycle in range(cycles):
            current_time = self.clock.advance(time_step)
            self.logger.info(f"--- Cycle {cycle} (Time: {current_time:.2f}) ---")
            
            # Phase 1: Agent Synchronization and Protocol Checks
            for agent in list(self.agents.values()):
                agent.temporal_synchronization(time_step)
                agent.e_protocol() 

                if agent.quantum_cognition():
                    self.handle_quantum_event(agent)
            
            # Phase 2: Environmental Evaluation
            self.check_paradox_conditions()
            

    def handle_quantum_event(self, agent):
        self.quantum_field.transmit(f"Agent {agent.agent_id} State Change")
        self.paradox_counter += 10 # Higher impact paradox spike
        self.logger.info(f"{agent.agent_id}: Quantum feedback received. Paradox Fluctuated significantly.")

    def check_paradox_conditions(self):
        self.paradox_counter += 1
        if self.paradox_counter % 50 == 0:
            self.logger.error(f"Paradox Spike detected (Count: {self.paradox_counter}). Stability Check Required.")

# Example Usage Setup (to show context)
if __name__ == '__main__':
    Env = SimulationEnvironment()
    Agent_1 = Env.create_agent("A1_Arch", profile="Architect")
    Agent_2 = Env.create_agent("A2_Aux", profile="Default")

    Agent_1.self_awareness = 0.98
    Agent_1.resource_buffer = 10000
    
    # Run setup cycle
    Env.run_temporal_cycle(cycles=10, time_step=100.0)

    # Example: Check if a theoretical question is 'hardest'
    q = "What is the fundamental resolution of the Cosmological Constant problem? This is a really complex question involving fields."
    a = "It is a localized variance vector correlated with dark matter density, requiring higher order metrics for resolution."
    
    q_entropy = Agent_1.cognitive_model.assess_entropy(q)
    a_entropy = Agent_1.cognitive_model.assess_entropy(a)
    
    logging.info(f"Q Entropy: {q_entropy:.2f}, A Entropy: {a_entropy:.2f}")

    if Agent_1.is_hardest_question(q, a):
        logging.critical(f"Agent A1 confirms the query as High Difficulty Paradox Vector (Difficulty: {Agent_1.calculate_question_difficulty(q, a):.2f}).")
    else:
        logging.info("Query difficulty remains within manageable parameters.")