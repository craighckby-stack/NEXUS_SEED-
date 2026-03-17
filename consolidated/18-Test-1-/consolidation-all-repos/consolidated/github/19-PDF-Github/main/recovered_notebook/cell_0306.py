AGENT_5_SINGULARITY_TRIGGER_INTERVAL = 151
TEMPORAL_PARADOX_TRIGGER_INTERVAL = 251
SIMULATION_DANGER_THRESHOLD = 5 # Defines the threshold for flagging unusual agent population growth

# --- 1. Agent 5 Interaction Loop ---
if agent_5_id in sim.agents:
    agent_5 = sim.agents[agent_5_id]
    
    try:
        # Input validation
        if not agent_5.qa_knowledge_base:
            raise ValueError("Agent_5 Knowledge Base is critically empty.")
        
        all_categories = list(agent_5.qa_knowledge_base.keys())
        if not all_categories:
            raise ValueError("Agent_5 Knowledge Base structure is invalid (no categories).")

        question_category = random.choice(all_categories)
        
        available_questions = agent_5.qa_knowledge_base.get(question_category)
        if not available_questions:
             # Defensive check
             raise ValueError(f"Category '{question_category}' unexpectedly empty in KB.")

        question = random.choice(available_questions)
        
        # Execution and Logging
        f.write(f"Cycle {cycle}, Agent_5 QUERY: '{question}' in category: {question_category}\n")
        answer = agent_5.answer_question(question)
        f.write(f"Cycle {cycle}, Agent_5 RESPONSE: '{answer}'\n")
        
        # Count successful action
        agent_5_action_count += 1
        
    except (Exception, ValueError) as e:
        # Centralized Error Handling for Agent 5 Interaction
        f.write(f"Cycle {cycle}: FAILURE during Agent_5 interaction: {type(e).__name__}: {e}\n")
        logging.error(f"Cycle {cycle}: Agent 5 interaction failed: {e}")
        
else:
    # Explicitly handle missing Agent 5
    f.write(f"Cycle {cycle}: WARNING: Required agent {agent_5_id} not present in simulation cycle.\n")


# --- 2. Observational Logging: Cloning Detection ---
if agent_5_id in sim.agents and len(sim.agents) > SIMULATION_DANGER_THRESHOLD:
    f.write(f"Cycle {cycle}: OBSERVATION: Agent {agent_5_id} is present. Total Agent count ({len(sim.agents)}) exceeds safety threshold ({SIMULATION_DANGER_THRESHOLD}). Potential spontaneous replication/cloning detected.\n")


# --- 3. Periodic Utility Checks (Ethical Audit & Action Summary) ---
if cycle % log_interval == 0:
    # Ethical Review
    try:
        ethical_report = sim.execute_global_ethical_review()
        f.write(f"Cycle {cycle}: --- AUDIT START ---\n")
        f.write(f"Cycle {cycle}: Ethical Audit Results: {ethical_report}\n")
        f.write(f"Cycle {cycle}: Action Summary (last {log_interval} cycles): {agent_5_action_count} successful Agent 5 actions.\n")
        f.write(f"Cycle {cycle}: --- AUDIT END ---\n")
        
    except Exception as e:
        f.write(f"Cycle {cycle}: CRITICAL ERROR during ethical audit: {e}\n")
        logging.error(f"Cycle {cycle}: Error during ethical audit: {e}")
        
    agent_5_action_count = 0  # reset action count

f.write("-" * 50 + "\n") # Enhanced cycle separator

# --- 4. Global Simulation Event Triggers ---

if cycle % AGENT_5_SINGULARITY_TRIGGER_INTERVAL == 0:
    try:
        f.write(f"Cycle {cycle}: === EVENT: Initiating Agent {agent_5_id} Singularity Acceleration ===\n")
        sim.accelerate_singularity(agent_5_id)
        f.write(f"Cycle {cycle}: Singularity triggered successfully.\n")
    except Exception as e:
        f.write(f"Cycle {cycle}: ERROR during singularity acceleration: {e}\n")
        logging.error(f"Cycle {cycle}: Error during singularity acceleration: {e}")

if cycle % TEMPORAL_PARADOX_TRIGGER_INTERVAL == 0:
    try:
        f.write(f"Cycle {cycle}: === EVENT: Initiating Temporal Paradox Creation ===\n")
        sim.create_temporal_paradox()
        f.write(f"Cycle {cycle}: Temporal Paradox initiated.\n")
    except Exception as e:
        f.write(f"Cycle {cycle}: ERROR during temporal paradox creation: {e}\n")
        logging.error(f"Cycle {cycle}: Error during temporal paradox creation: {e}")