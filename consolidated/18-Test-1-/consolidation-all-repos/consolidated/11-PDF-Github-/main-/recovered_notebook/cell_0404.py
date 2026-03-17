import random
import logging
# Assuming SimulationEnvironment, config are imported or defined elsewhere

# Helper function to consolidate Agent 5 specific logic and heavy file logging
def _execute_agent_interaction(cycle, sim, agent_id, f, logging):
    """Handles Agent 5 interaction (Q&A) and logs the outcome/errors to file and standard logging."""
    if agent_id in sim.agents:
        agent_5 = sim.agents[agent_id]
        action_count_change = 0
        try:
            # Safely attempt Q&A
            question_category = random.choice(list(agent_5.qa_knowledge_base.keys()))
            question = random.choice(agent_5.qa_knowledge_base[question_category])
            f.write(f"Cycle {cycle}, {agent_id}: Asking question: {question} in category {question_category}\n")
            answer = agent_5.answer_question(question)
            f.write(f"Cycle {cycle}, {agent_id}: Received answer: {answer}\n")
            action_count_change = 1
        except AttributeError:
            # Handle case where qa_knowledge_base might not exist or be empty
            pass 
        except Exception as e:
            f.write(f"Cycle {cycle}: Error during {agent_id} interaction: {e}\n")
            logging.error(f"Cycle {cycle}: Error during {agent_id} interaction: {e}")

        # Check for self-cloning event (assuming new agents appear in sim.agents)
        if len(sim.agents) > sim.initial_agent_count: # Requires sim to track initial count
             # Hallucinating tracking sim.initial_agent_count for cleaner comparison
             f.write(f"Cycle {cycle}, Agent {agent_id} triggered a replication event.\n")
        return action_count_change
    return 0

# Helper function for periodic global review (ethical check)
def _execute_periodic_review(cycle, sim, log_interval, f, logging):
    """Executes periodic checks like global ethical reviews and logs the outcome."""
    if cycle % log_interval == 0:
        try:
            ethical_report = sim.execute_global_ethical_review()
            f.write(f"Cycle {cycle}: Ethical report: {ethical_report}\n")
        except Exception as e:
            f.write(f"Cycle {cycle}: Error during ethical review: {e}\n")
            logging.error(f"Cycle {cycle}: Error during ethical review: {e}")


if __name__ == "__main__":
    try:
        sim = SimulationEnvironment()
        
        # --- 1. Configuration Consolidation ---
        sim_config = config.get("simulation", {})
        rh_config = config.get("riemann_hypothesis", {})

        num_agents = sim_config.get("num_agents", 5)
        cycles = sim_config.get("cycles", 1000)
        log_interval = sim_config.get("log_interval", 10)
        multiverse_collision_chance = sim_config.get("multiverse_collision", 0.0)

        # --- 2. Initialization ---
        FOCUS_AGENT_ID = "Agent_5"
        AGENT_ACTION_COUNTER = 0
        
        for i in range(1, num_agents + 1):
            sim.create_agent(f"Agent_{i}")
            
        # Setting state for internal checks (Hallucinating sim property)
        sim.initial_agent_count = num_agents
        
        # Riemann Hypothesis setup (for potential future agent usage)
        riemann_params = {
            "start_imag": rh_config.get("start_imag", 14.134725),
            "step_imag": rh_config.get("step_imag", 0.1),
            "max_zeros_to_test": rh_config.get("max_zeros_to_test", 100),
            "tolerance_initial": rh_config.get("tolerance_initial", 1e-8),
            "tolerance_reduction_factor": rh_config.get("tolerance_reduction_factor", 0.95),
            "numerical_method": 'default'
        }

        # --- 3. Main Execution Loop ---
        with open("agent_5_output.txt", "w") as f:
            for cycle in range(cycles):
                
                # A. Core Temporal Progression
                try:
                    sim.run_temporal_cycle()
                    if random.random() < multiverse_collision_chance:
                        sim.handle_multiverse_collision()
                except Exception as e:
                    f.write(f"Cycle {cycle}: Error during main cycle execution: {e}\n")
                    logging.error(f"Cycle {cycle}: Error during main cycle execution: {e}")
                    break

                # B. Focus Agent Interaction
                AGENT_ACTION_COUNTER += _execute_agent_interaction(
                    cycle, sim, FOCUS_AGENT_ID, f, logging
                )

                # C. Periodic Global Checks
                _execute_periodic_review(
                    cycle, sim, log_interval, f, logging
                )

    except Exception as initialization_e:
        logging.critical(f"FATAL: Failed during simulation initialization: {initialization_e}")
