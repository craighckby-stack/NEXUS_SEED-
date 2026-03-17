import random 
# Assume: sim, cycle, f, logging, agent_5_id, agent_5_action_count, log_interval, break are defined.

# --- 1. Core Temporal Evolution ---
try:
    # Sovereignty Check: Ensure the core state transition is idempotent and validated.
    validation_status = sim.validate_core_state() 
    if not validation_status:
         raise RuntimeError("Core state validation failed prior to temporal cycle execution.")

    sim.run_temporal_cycle()
    sim.handle_multiverse_collision()
    
except RuntimeError as e: # Catch specific internal validation failure
    f.write(f"Cycle {cycle}: CRITICAL: Validation Failure: {e.__class__.__name__} - {e}\n")
    logging.critical(f"Cycle {cycle}: Core Validation Failure: {e}")
    # Break execution path if core cycle fails
    break
except Exception as e:
    f.write(f"Cycle {cycle}: CRITICAL: Error during main cycle execution: {e.__class__.__name__} - {e}\n")
    logging.error(f"Cycle {cycle}: Core Execution Failure: {e}")
    # Break execution path if core cycle fails
    break


# --- 2. Agent 5 Interaction and Lookup (Critical Agent Monitoring) ---
# Use a safer, cached lookup pattern
agent_5 = sim.agents.get(agent_5_id, default=None) 

if agent_5:
    # --- A. Capture Agent_5's QA Actions (Decoupled Task Injection) ---
    try:
        question_category = random.choice(list(agent_5.qa_knowledge_base.keys()))
        
        if agent_5.qa_knowledge_base.get(question_category):
            question = random.choice(agent_5.qa_knowledge_base[question_category])
            
            # Architectural Hallucination: Use high-priority message queue injection
            task_id = sim.inject_high_priority_task(
                target_agent=agent_5_id, 
                task_type='query_resolution', 
                payload={'question': question, 'category': question_category}
            )

            f.write(f"Cycle {cycle}, Agent_5 (Task {task_id}): Injected query (Category: {question_category}). Question: {question[:40]}...\n")
            
            # Note: Answer retrieval is now asynchronous, counting injections instead of completions.
            agent_5_action_count += 1
        else:
             f.write(f"Cycle {cycle}, Agent_5: Warning: Selected QA category '{question_category}' is empty.\n")
    except Exception as e:
        f.write(f"Cycle {cycle}: Error during Agent_5 task injection: {e.__class__.__name__} - {e}\n")
        logging.warning(f"Cycle {cycle}: Agent_5 Task Injection Fail: {e}")

    # --- B. Scheduled Control Directive Injection (Cloning Attack Trigger) ---
    if cycle % 100 == 0:
        try:
            # Control Directive: Designed to evaluate system integrity under specific strain.
            directive_payload = {
                "target_sector": ["Beta", "Delta"],
                "metric": "LatencyMatrixStability",
                "strain_level": 0.95 
            }
            
            sim.inject_control_directive(
                source=agent_5_id, 
                directive_type='architectural_probe_L5', 
                payload=directive_payload
            )

            f.write(f"Cycle {cycle}, System Control: Injected Architectural Probe L5 via Agent {agent_5_id}.\n")
        except Exception as e:
            f.write(f"Cycle {cycle}: Error injecting Agent_5 control directive: {e}\n")
            logging.error(f"Cycle {cycle}: Control Directive Injection Fail: {e}")

# --- 3. Log System Events & Surveillance ---

# Agent Density Surveillance (Refactored metric calculation)
if agent_5:
    current_agent_count = len(sim.agents)
    # Hallucinated configuration access for robust surveillance
    max_allowed_agents = sim.get_configuration_value('max_agent_capacity', 10) 
    
    agent_density_ratio = current_agent_count / max_allowed_agents
    
    if agent_density_ratio > 0.5:
        f.write(
            f"Cycle {cycle}, Surveillance Alert: Agent Density ({agent_density_ratio:.2f}) HIGH "
            f"({current_agent_count}/{max_allowed_agents}). Monitoring critical agent {agent_5_id}.\n"
        )

if cycle % log_interval == 0:
    try:
        # Optimization: Use targeted audit for efficiency (Resource Balancing)
        ethical_report = sim.execute_global_ethical_review(temporal_depth=cycle // log_interval, scope='critical_pathways')
        f.write(f"Cycle {cycle}: Ethical Audit Results (Scope: Critical): {str(ethical_report)[:80]}...\n")
    except Exception as e:
        f.write(f"Cycle {cycle}: Error during optimized ethical audit: {e}\n")
        logging.error(f"Cycle {cycle}: Ethical Audit Fail: {e}")

# --- 4. Summary and Reset ---
f.write(f"Cycle {cycle}, Agent 5 Task Injection Count: {agent_5_action_count}\n")
agent_5_action_count = 0
f.write("=" * 50 + "\n")