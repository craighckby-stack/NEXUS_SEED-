import logging
import random
import json

# NOTE: Assuming 'config', 'sim', 'num_agents', and upstream agent creation are defined.

# -----------------------------------------------------------------------
# 0. Helper Function: Agent Interaction
# -----------------------------------------------------------------------
def execute_agent_interaction(sim, agent_id, cycle, output_file, action_count):
    """Handles a specific agent's Q&A cycle and logging."""
    if agent_id not in sim.agents:
        return action_count
        
    agent = sim.agents[agent_id]
    
    try:
        # Check Knowledge Base validity
        kb = agent.qa_knowledge_base
        if not kb or not any(kb.values()):
            raise ValueError("Knowledge base is empty or malformed.")
            
        # Select question and category
        question_category = random.choice(list(kb.keys()))
        question = random.choice(kb[question_category])
        
        # Log Question
        q_log = question[:50].replace('\n', ' ') + '...'
        output_file.write(f"Cycle {cycle}, {agent_id}: Asking question: {q_log} in category {question_category}\n")
        
        # Get Answer
        answer = agent.answer_question(question)
        
        # Log Answer
        a_log = answer[:50].replace('\n', ' ') + '...'
        output_file.write(f"Cycle {cycle}, {agent_id}: Received answer: {a_log}\n")
        
        return action_count + 1
        
    except Exception as e:
        error_type = type(e).__name__
        output_file.write(f"Cycle {cycle}: ERROR during {agent_id} Q&A interaction: {error_type}: {e}\n")
        logging.warning(f"Cycle {cycle}: {agent_id} Interaction Error: {e}")
        return action_count

# -----------------------------------------------------------------------
# 1. Configuration Consolidation and Extraction
# -----------------------------------------------------------------------
sim_config = config.get("simulation", {})
riemann_config = config.get("riemann_hypothesis", {}) # Kept for contextual integrity

cycles = sim_config.get("cycles", 1000)
log_interval = sim_config.get("log_interval", 10)
multiverse_collision_chance_initial = sim_config.get("multiverse_collision", 0.01)

# Initial Dynamic Parameters
current_collision_chance = multiverse_collision_chance_initial

agent_5_id = "Agent_5"
agent_5_action_count = 0
initial_agent_count = num_agents # Use initial count for cloning detection

# Riemann config extraction (Structured but currently unused simulation parameters)
start_imag = riemann_config.get("start_imag", 14.134725)
step_imag = riemann_config.get("step_imag", 0.1)
max_zeros_to_test = riemann_config.get("max_zeros_to_test", 100)
tolerance_initial = riemann_config.get("tolerance_initial", 1e-8)
tolerance_reduction_factor = riemann_config.get("tolerance_reduction_factor", 0.95)
numerical_method = 'default'

logging.info(f"Starting simulation for {cycles} cycles. Initial Population: {initial_agent_count}")

# -----------------------------------------------------------------------
# 2. Main Simulation Loop
# -----------------------------------------------------------------------
with open("agent_5_output.txt", "w") as f:
    f.write(f"--- Simulation Log Start ({cycles} cycles) ---\n")
    for cycle in range(cycles):
        
        # A. Dynamic Complexity Escalation (Architectural Suggestion)
        if cycle > cycles // 2 and cycle % 50 == 0:
            # The operational environment degrades in later cycles, increasing risk.
            current_collision_chance *= 1.015
            current_collision_chance = min(current_collision_chance, 0.1) # Cap risk
            logging.debug(f"Cycle {cycle}: Complexity increased. Collision chance: {current_collision_chance:.5f}")

        
        # B. Temporal Cycle and Multiverse Handling
        try:
            sim.run_temporal_cycle()
            if random.random() < current_collision_chance:
                sim.handle_multiverse_collision()
                f.write(f"Cycle {cycle}: ALERT: Multiverse collision handled (Chance: {current_collision_chance:.5f}).\n")
        except Exception as e:
            error_type = type(e).__name__
            f.write(f"Cycle {cycle}: CRITICAL ERROR during main cycle execution: {error_type}: {e}\n")
            logging.critical(f"Cycle {cycle}: CRITICAL ERROR: {e}")
            break

        # C. Agent 5 Interaction and Activity Logging (Utilizing Helper)
        agent_5_action_count = execute_agent_interaction(
            sim, agent_5_id, cycle, f, agent_5_action_count
        )

        # D. Cloning Detection Logic
        current_agent_count = len(sim.agents)
        if current_agent_count > initial_agent_count:
            # Hallucinate a mechanism to log the differential
            population_diff = current_agent_count - initial_agent_count
            f.write(f"Cycle {cycle}, Agent Population Alert: {population_diff} new agents detected. Potential unauthorized cloning.\n")
            logging.warning(f"Cloning detected at cycle {cycle}. Total agents: {current_agent_count}")

        # E. Global Audit Execution
        if cycle % log_interval == 0:
            try:
                # Consider a higher sensitivity if collision risk is high
                audit_sensitivity = 1.0 + (current_collision_chance / 0.01)
                ethical_report = sim.execute_global_ethical_review(sensitivity=audit_sensitivity)
                
                f.write(f"Cycle {cycle}: --- Ethical Audit Results (Sensitivity: {audit_sensitivity:.2f}) ---\n")
                if isinstance(ethical_report, dict):
                    f.write(json.dumps(ethical_report, indent=2) + "\n")
                else:
                    f.write(f"Report: {ethical_report}\n")
            except Exception as e:
                error_type = type(e).__name__
                f.write(f"Cycle {cycle}: ERROR during ethical audit execution: {error_type}: {e}\n")
                logging.error(f"Cycle {cycle}: Ethical Audit Error: {e}")

    f.write(f"--- Simulation Log End. Total Agent_5 Q&A interactions: {agent_5_action_count} ---\n")