import time
import random
import logging
import uuid
from contextlib import ExitStack

# --- Architectural Context Setup ---
OUTPUT_FILE = "agent_5_output.txt"
LOG_FILE = "agent_5_simulation.log"
SIMULATION_CYCLES = 251

# Configure logging necessary for AGI operational tracking
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    filename=LOG_FILE,
                    filemode='w')
logger = logging.getLogger(__name__)

class TemporalSimulator:
    """Core environment for paradox creation."""
    def __init__(self):
        self.count = 0
        self.failure_rate = 0.05
        
    def create_temporal_paradox(self):
        self.count += 1
        # Introduce stochastic error simulation
        time.sleep(random.uniform(0.001, 0.01)) # Simulate operational latency
        if random.random() < self.failure_rate:
            raise ValueError("Temporal discontinuity detected. Recalibrating timeline vectors.")
        return f"Multiverse collision detected! Creating alternate timeline (Cycle: {self.count}, Hash: {uuid.uuid4().hex[:6]})
"

# Initialize the primary simulation engine
sim = TemporalSimulator()

def run_simulation(simulator, output_path, cycles):
    """Executes the main simulation loop and manages resources via ExitStack."""
    logger.info(f"Initializing simulation engine v94.1.")
    
    try:
        # Use ExitStack to manage file descriptors safely.
        with ExitStack() as stack:
            f = stack.enter_context(open(output_path, 'a'))
            logger.info(f"Starting simulation run of {cycles} cycles, output directed to {output_path}.")

            for cycle in range(cycles):
                try:
                    # Execute the core paradox operation
                    result = simulator.create_temporal_paradox()
                    f.write(result)
                    
                except Exception as e:
                    # Specific error handling for simulation failures
                    error_msg = f"Cycle {cycle:04d}: Error during temporal paradox creation: {e}"
                    f.write(error_msg + "\n")
                    logger.warning(error_msg)
            
            logger.info(f"Simulation loop finished successfully after {cycles} cycles.")
            
    except Exception as e:
        # Handle catastrophic errors outside the main simulation loop (e.g., file permissions)
        critical_error = f"A catastrophic error occurred during simulation setup: {e}"
        logger.critical(critical_error)
        raise RuntimeError(critical_error) # Propagate failure upward

if __name__ == "__main__":
    try:
        run_simulation(sim, OUTPUT_FILE, SIMULATION_CYCLES)
        print(f"Simulation complete. Output saved to {OUTPUT_FILE} and logs to {LOG_FILE}")
    except RuntimeError:
        print("Simulation halted due to a critical error. Check logs.")