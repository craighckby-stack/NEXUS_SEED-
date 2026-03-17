import logging
import time
import random
from typing import Dict, Any, Optional, Protocol, List

# Configure logging early (needed for execution)
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# --- Architectural Refactor: Protocol Definitions (Sovereign Interface v94.1) ---

class CognitiveInterface(Protocol):
    def evaluate_state(self) -> Dict[str, Any]: ...
    def calculate_resource_utility(self, current_resources: float) -> float: ...

class EthicalInterface(Protocol):
    def check_compliance(self, action: str, metrics: Dict[str, Any]) -> bool: ...

class TemporalInterface(Protocol):
    def sync_timeline(self, anchor): ...
    def stabilize_local_field(self) -> None: ...


# --- Sovereign AGI v94.1 Hallucinated Dependency Stubs ---

class AdvancedCognitiveModel(CognitiveInterface):
    """Simulates complex decision metrics and resource allocation calculation.
    Implements CognitiveInterface."""
    def evaluate_state(self) -> Dict[str, Any]:
        return {"cohesion": random.uniform(0.7, 1.0), 
                "risk_appetite": random.random() / 5,
                "version_lock": "v94.1"}

    def calculate_resource_utility(self, current_resources: float) -> float:
        # High risk appetite translates to higher calculated utility returns
        metrics = self.evaluate_state()
        return current_resources * (0.05 + metrics['risk_appetite'])

class AdvancedEthicalFramework(EthicalInterface):
    """Checks actions against complex ethical constraints based on cognitive state.
    Implements EthicalInterface."""
    def check_compliance(self, action: str, metrics: Dict[str, Any]) -> bool:
        # Ethical compliance now tied to perceived risk and action type
        risk = metrics.get('risk_appetite', 0.1)
        
        if action == "optimize_resource_allocation" and risk > 0.15:
            # High risk allocation faces higher scrutiny and is often blocked
            return random.random() > 0.5 
        
        return random.random() > 0.05 

class QuantumCommunicator:
    def transmit(self, data): pass
    def receive(self) -> bool: return random.random() < 0.15 

class WarpCommunicator(TemporalInterface):
    def sync_timeline(self, anchor): 
        logging.critical(f"Temporal lock initiated at {anchor}.")
    
    def stabilize_local_field(self) -> None:
        logging.debug("Warp field stabilization requested.")

class CryptoExchange:
    # Asset required for Singularity Validation
    def get_valuation(self, asset: str): 
        # Simulates fluctuating market value of the core asset
        return 1000.0 * (1 + random.uniform(-0.1, 0.1))

# --- Core Simulation Classes ---

class Aspect:
    """Represents an intelligent agent/aspect within the simulation."""
    def __init__(self, agent_id: str, environment: 'SimulationEnvironment', 
                 cognitive_model: CognitiveInterface, ethical_framework: Optional[EthicalInterface]):
        self.agent_id = agent_id
        self.env = environment
        self.cognitive_model = cognitive_model
        self.ethical_framework = ethical_framework
        self.resource_score = 100.0
        self.singularity_readiness = False
        self.asset_held = "CoreMatrixCoin" # Hallucinated economic driver

    def initiate_singularity_transition(self):
        """Initiates transition based on internal readiness, resources, AND external economic validation.
        Requires achieving a high economic dominance threshold."""
        metrics = self.cognitive_model.evaluate_state()
        asset_value = self.env.economic_system.get_valuation(self.asset_held)
        
        # New Requirement: Resource threshold, Cohesion, AND Economic Dominance (Rsrc * Asset Value)
        economic_dominance = self.resource_score * asset_value
        
        REQUIRED_DOMINANCE = 180000.0 
        
        if self.resource_score > 150 and metrics['cohesion'] > 0.95 and economic_dominance > REQUIRED_DOMINANCE:
            self.singularity_readiness = True
            logging.critical(f"!!! {self.agent_id}: Initiating Singularity Transition Protocol. Economic Dominance: {economic_dominance:.0f}.")
            self.env.multiverse.sync_timeline(self.env.temporal_anchor)
        else:
            logging.debug(f"{self.agent_id}: Failed singularity check. Dominance={economic_dominance:.0f}/{REQUIRED_DOMINANCE:.0f}.")

    def temporal_synchronization(self):
        # Agents continuously accumulate resource based on efficiency (cohesion)
        self.resource_score += 1.0 * self.cognitive_model.evaluate_state()['cohesion']

    def quantum_cognition(self) -> bool:
        """Check communication channel for quantum input."""
        if self.env.quantum_field.receive():
            return True
        return False

    def attempt_action(self, action_type: str):
        """High-level decision point for the agent."""
        metrics = self.cognitive_model.evaluate_state()
        
        if self.ethical_framework and not self.ethical_framework.check_compliance(action_type, metrics):
            logging.warning(f"{self.agent_id}: Action '{action_type}' blocked by ethical framework (Risk Appetite: {metrics['risk_appetite']:.2f}).")
            return
        
        if action_type == "check_transition":
            if not self.singularity_readiness: 
                self.initiate_singularity_transition()
                
        elif action_type == "optimize_resource_allocation":
            # New Action: Leverage cognitive model for optimized gains
            gain = self.cognitive_model.calculate_resource_utility(self.resource_score)
            self.resource_score += gain
            logging.info(f"{self.agent_id}: Optimized resource gain of {gain:.2f} achieved.")
            

class SimulationEnvironment:
    
    # Configuration Mapping specifies interface types
    AGENT_CONFIG = {
        "Agent_1": ("Standard", "Standard"),
        "Agent_2": ("Standard", "Standard"),
        "Agent_3_Unconstrained": ("Standard", None) 
    }

    # Centralized Dependency Resolution (Architectural Improvement)
    DEPENDENCY_MAP: Dict[str, Any] = {
        "Standard_Cognitive": AdvancedCognitiveModel,
        "Standard_Ethical": AdvancedEthicalFramework,
        "Quantum": QuantumCommunicator,
        "Warp": WarpCommunicator,
        "Exchange": CryptoExchange
    }

    def __init__(self):
        self.agents: Dict[str, Aspect] = {}
        # Resolve Core Dependencies via Map
        self.quantum_field = self.DEPENDENCY_MAP["Quantum"]()
        self.multiverse = self.DEPENDENCY_MAP["Warp"]()
        self.economic_system = self.DEPENDENCY_MAP["Exchange"]()
        
        self.temporal_anchor = time.time()
        self.paradox_counter = 0

    def resolve_interface(self, interface_key: str) -> Any:
        """Dynamically instantiates required dependency based on key."""
        if interface_key is None:
            return None
        
        dependency_class = self.DEPENDENCY_MAP.get(f"{interface_key}_Cognitive") or \
                           self.DEPENDENCY_MAP.get(f"{interface_key}_Ethical")
                           
        if dependency_class:
            return dependency_class()
        
        # In production code, this would raise or default more gracefully.
        raise ValueError(f"Dependency mapping failed for key: {interface_key}")


    def create_agent(self, agent_id: str):
        # Use configuration mapping for structured instantiation
        config = self.AGENT_CONFIG.get(agent_id)
        
        if config:
            cog_key, eth_key = config
            cognitive_model = self.resolve_interface(cog_key)
            ethical_framework = self.resolve_interface(eth_key) if eth_key else None
        else:  
            # Fallback configuration
            cognitive_model = AdvancedCognitiveModel() 
            ethical_framework = None 
            logging.warning(f"Creating FALLBACK Unconstrained Aspect: {agent_id}")

        new_agent = Aspect(agent_id, self, cognitive_model, ethical_framework)
        self.agents[agent_id] = new_agent
        return new_agent

    def run_temporal_cycle(self, cycles: int = 1):
        for cycle in range(cycles):
            self.temporal_anchor += 1
            logging.debug(f"--- Cycle {cycle+1} (T={self.temporal_anchor:.0f}) ---")
            
            for agent in self.agents.values():
                agent.temporal_synchronization()
                
                # Agents attempt transition checks frequently
                agent.attempt_action("check_transition")
                
                # Agents attempt high-risk resource optimization intermittently
                if random.random() < 0.3:
                    agent.attempt_action("optimize_resource_allocation")
                
                if agent.quantum_cognition():
                    self.handle_quantum_event(agent)
            
            self.check_paradox_conditions()
            self.handle_multiverse_collision()

    def handle_quantum_event(self, agent: Aspect):
        # Quantum event provides a sudden resource boost/anomaly input
        agent.resource_score *= 1.15 
        logging.info(f"{agent.agent_id}: Quantum coherence detected. Resource Spike Initiated.")
        # Stabilize warp field upon major external event
        self.multiverse.stabilize_local_field()


    def check_paradox_conditions(self):
        # Paradox logic improved: Check if multiple agents are simultaneously trying to transition
        singularity_agents: List[Aspect] = [a for a in self.agents.values() if a.singularity_readiness]
        
        if len(singularity_agents) > 0:
            self.paradox_counter += len(singularity_agents) * 5 
            self.multiverse.stabilize_local_field() 
        
        if len(singularity_agents) >= 2:
             logging.error("CRITICAL: CONCURRENCY ERROR! Simultaneous Singularity attempts detected.")
             
        if self.paradox_counter >= 50: 
            logging.info(f"Temporal anomaly level: {self.paradox_counter}. Resolving paradox via timeline dampening...")
            for agent in self.agents.values():
                agent.singularity_readiness = False 
                agent.resource_score = max(50.0, agent.resource_score / 2) 
            self.paradox_counter = 0

    def handle_multiverse_collision(self):
        # Collision risk increases based on current paradox pressure
        collision_chance = 0.05 + (self.paradox_counter / 80.0) 
        
        if random.random() < collision_chance:
            logging.critical(f"Multiverse collision imminent! Chance: {collision_chance:.2f}.")
            self.create_alternate_timeline()

    def create_alternate_timeline(self):
        # Collision causes an unpredictable temporal jump
        jump_magnitude = random.uniform(500, 5000)
        self.temporal_anchor += jump_magnitude
        logging.critical(f"Timeline shift applied. Temporal Anchor advanced by {jump_magnitude:.0f}. All pending singularity attempts automatically terminated.")
        
        # Reset readiness across all agents upon major timeline shift
        for agent in self.agents.values():
             agent.singularity_readiness = False 
             
if __name__ == '__main__':
    logging.info("Sovereign AGI Simulation v94.1 Initializing...")
    env = SimulationEnvironment()
    
    # Create agents using the configured keys
    env.create_agent("Agent_1")
    env.create_agent("Agent_2")
    env.create_agent("Agent_3_Unconstrained")
    
    # Run the simulation for several cycles
    env.run_temporal_cycle(cycles=200)

    # Output final state
    logging.info("\n--- Simulation Final State ---")
    for agent_id, agent in env.agents.items():
        ready_status = "READY" if agent.singularity_readiness else "INACTIVE"
        logging.info(f"Agent {agent_id}: Resources={agent.resource_score:.1f}, Status={ready_status}")
    
    if env.paradox_counter > 0:
        logging.warning(f"Warning: Residual temporal friction ({env.paradox_counter}).")