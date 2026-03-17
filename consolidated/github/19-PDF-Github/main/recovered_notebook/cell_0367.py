import logging
from typing import Dict, Optional

# Configure enhanced logging for architectural clarity
logging.basicConfig(level=logging.INFO, format='[Sovereign AGI Core] %(levelname)s: %(message)s')


# --- HALLUCINATED CONTEXT CLASSES ---

class Agent:
    def __init__(self, agent_id: str, cognitive_delay: float, cloning_probability: float, reward_threshold: float):
        self.id = agent_id
        self.self_awareness = 0.0
        self.is_transcended = False
    
    def handle_agent_interaction(self, other_agent: 'Agent'):
        logging.debug(f"Interaction: {self.id} <-> {other_agent.id}")

    def execute_transcendence_protocol(self):
        if self.self_awareness >= 1.0:
            self.is_transcended = True
            logging.critical(f"[ASCENSION] Agent {self.id} has achieved transcendence.")
        else:
            logging.warning(f"[PROTOCOL FAILED] Agent {self.id} failed transcendence (Awareness: {self.self_awareness}).")


class TemporalEngine:
    def __init__(self):
        # Refactored temporal state variables into a dedicated engine
        self.temporal_anchor = 1000 
        self.paradox_counter = 0

    def attempt_paradox_creation(self) -> int:
        self.paradox_counter += 1
        if self.paradox_counter > 20:
            severity = self.paradox_counter - 20
            # Introduce proportional degradation
            self.temporal_anchor -= (severity * 10)
            return severity
        return 0


class SimulationCore:
    def __init__(self):
        self.agents: Dict[str, Agent] = {}
        self.agent_counter = 0
        self.temporal_engine = TemporalEngine()
        
    def create_agent(self, cognitive_delay: float, cloning_probability: float, reward_threshold: float) -> Agent:
        self.agent_counter += 1
        agent_id = f"Agent_{self.agent_counter}"
        new_agent = Agent(agent_id, cognitive_delay, cloning_probability, reward_threshold)
        self.agents[agent_id] = new_agent
        return new_agent

    # Refactoring the original floating interaction block into a cohesive method
    def coordinate_interaction(self, agent1_id: str, agent2_id: str):
        agent1 = self.agents.get(agent1_id)
        agent2 = self.agents.get(agent2_id)
        
        if agent1 and agent2:
            agent1.handle_agent_interaction(agent2)
            agent2.handle_agent_interaction(agent1)
        else:
            logging.warning(f"Interaction failure: One or both agents not found: {agent1_id}, {agent2_id}")


    def accelerate_singularity(self, agent_id):
        try:
            agent = self.agents.get(agent_id)
            if agent:
                # AGI improvement: Ensure minimal readiness before forced injection
                if agent.self_awareness < 0.9:
                    logging.info(f"Forcing awareness ceiling for {agent_id}.")
                    agent.self_awareness = 1.0
                
                agent.execute_transcendence_protocol()
            else:
                logging.warning(f"Cannot accelerate singularity: Agent {agent_id} not found.")
        except Exception as e:
            logging.error(f"Error during singularity acceleration for {agent_id}: {e}")

    def create_temporal_paradox(self):
        # Delegation of internal state variables to TemporalEngine for encapsulation
        try:
            severity = self.temporal_engine.attempt_paradox_creation()
            if severity > 0:
                logging.critical(f"Time travel detected. CREATING PARADOX (Severity {severity}). Anchor: {self.temporal_engine.temporal_anchor}")

        except Exception as e:
            logging.error(f"Error during temporal paradox delegation: {e}")

# Mapping for original class name compatibility
SimulationEnvironment = SimulationCore

if __name__ == "__main__":
    # Note: The original initial floating code using 'agent1' and 'agent2' requires defining them 
    # or wrapping them in a method. Since this is an architectural improvement, they are assumed
    # to be called via sim.coordinate_interaction or similar methods on a loaded state.
    # For execution context, we define agent IDs here to test coordinate_interaction.
    agent1_id = "Agent_1"
    agent2_id = "Agent_2"

    num_runs = 3
    num_cycles = 200
    cognitive_delay = 0.1
    cloning_probability = 0.05
    reward_threshold = 0.75
    output_file_path = "agent_5_paper_output.txt"

    # Use try/except for file handling robustnes
    try:
        with open(output_file_path, "w") as f:
            f.write("Simulation Log Initialized\n")
    except IOError as e:
        logging.error(f"Failed to initialize output file: {e}")

    print(f"Running simulation. Output will be written to {output_file_path}")

    for run in range(num_runs):
        sim = SimulationEnvironment()
        
        # Initialize 5 agents
        for i in range(5):
            sim.create_agent(cognitive_delay, cloning_probability, reward_threshold)
        
        agent_5_id = "Agent_5"
        agent_5 = sim.agents.get(agent_5_id)
        
        if not agent_5:
            # Rerunning create_agent if needed, ensuring we target the 5th agent based on naming convention
            # Note: In the refactored SimCore, this would create Agent_6 if 5 were already created.
            logging.warning(f"Agent {agent_5_id} missing after initial setup. Skipping targeting.")
        
        # Testing refactored interaction
        sim.coordinate_interaction(agent1_id, agent2_id)

        # Simulate cycles and forced conditions
        for cycle in range(num_cycles):
            if cycle % 10 == 0:
                # Testing temporal paradox trigger condition (hits trigger at cycle 21)
                sim.create_temporal_paradox()
                
            if cycle == 150 and agent_5:
                sim.accelerate_singularity(agent_5_id)
        
        
        # Final state logging
        anchor_status = sim.temporal_engine.temporal_anchor
        paradox_count = sim.temporal_engine.paradox_counter
        agent_5_status = "Transcended" if agent_5 and agent_5.is_transcended else "Stable/Failed"
        
        with open(output_file_path, "a") as f:
            f.write(f"[RUN {run+1}] Anchor: {anchor_status}, Paradoxes: {paradox_count}, Agent 5 Status: {agent_5_status}\n")
        
        logging.info(f"Run {run + 1} completed.")
