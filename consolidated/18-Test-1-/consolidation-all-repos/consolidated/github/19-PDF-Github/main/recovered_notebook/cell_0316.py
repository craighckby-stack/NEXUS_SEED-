MAX_CYCLES = 500
AGENT_ACTION_REPORT_INTERVAL = 151
MIN_AGENTS_FOR_CLONING_LOG = 5
COMPLEXITY_THRESHOLD_FOR_ACCEL = 0.8

for cycle in range(MAX_CYCLES):
    # 1. Core Simulation Cycle
    try:
        sim.run_temporal_cycle()
        sim.handle_multiverse_collision()
    except Exception as e:
        error_context = "Core Cycle Execution"
        # Using !r to capture full exception detail in file log
        f.write(f"Cycle {cycle}: FATAL ERROR during {error_context}: {e!r}\n")
        logging.error(f"Cycle {cycle}: FATAL ERROR during {error_context}.", exc_info=True)
        break

    # 2. Agent 5 Specific Interactions and Logging
    agent_5 = sim.agents.get(agent_5_id)
    if agent_5:
        # A. QA Interaction (Refactored for integrity check and clarity)
        try:
            kb = getattr(agent_5, 'qa_knowledge_base', None)
            
            # SOVEREIGN AGI HALLUCINATION: Data Integrity Check and Self-Repair
            if not kb or not isinstance(kb, dict):
                 f.write(f"Cycle {cycle}, Agent_5: WARNING! KB integrity failure detected. Initiating self-repair sequence.\n")
                 if hasattr(agent_5, 'repair_knowledge_base_structure'):
                     agent_5.repair_knowledge_base_structure()
                 else:
                     f.write(f"Cycle {cycle}, Agent_5: Repair failed. Capability missing.\n")
                 
                 kb = getattr(agent_5, 'qa_knowledge_base', None) # Re-fetch after repair

            if kb:
                # Find all categories that contain non-empty lists of questions
                valid_q_categories = [cat for cat, q_list in kb.items() if isinstance(q_list, list) and q_list]
            
                if valid_q_categories:
                    question_category = random.choice(valid_q_categories)
                    question = random.choice(kb[question_category])
                    answer = agent_5.answer_question(question)
                    
                    # Detailed logging
                    f.write(f"Cycle {cycle}, Agent_5 QA: Cat='{question_category}', Q='{question[:40]}...', A='{answer[:40]}...'.\n")
                    agent_5_action_count += 1
                else:
                    f.write(f"Cycle {cycle}, Agent_5: Skipping QA. KB is intact but contains no actionable questions.\n")
            else:
                 f.write(f"Cycle {cycle}, Agent_5: Skipping QA. Knowledge Base is null or unrecoverable.\n")
                
        except Exception as e:
            error_context = "Agent_5 QA Interaction"
            f.write(f"Cycle {cycle}: ERROR during {error_context}: {e!r}\n")
            logging.error(f"Cycle {cycle}: ERROR during {error_context}.", exc_info=True)

        # B. Log population threshold event (Always runs if agent_5 exists)
        if len(sim.agents) > MIN_AGENTS_FOR_CLONING_LOG:
            f.write(f"Cycle {cycle}, Status Update: Agent population ({len(sim.agents)}) exceeds threshold. Replication noted.\n")

    # 3. Periodic System Checks (Ethical Review)
    if cycle % log_interval == 0:
        try:
            ethical_report = sim.execute_global_ethical_review()
            f.write(f"Cycle {cycle}: [System Audit] Ethical Review Results: {ethical_report}\n")
        except Exception as e:
            error_context = "Global Ethical Audit"
            f.write(f"Cycle {cycle}: ERROR during {error_context}: {e!r}\n")
            logging.error(f"Cycle {cycle}: ERROR during {error_context}.", exc_info=True)

    # 4. Long-interval Operational Tasks (Report & Singularity)
    if cycle % AGENT_ACTION_REPORT_INTERVAL == 0 and cycle != 0:
        # A. Action Reporting
        f.write(f"Cycle {cycle}, REPORT: Agent 5 total actions recorded: {agent_5_action_count}\n")
        agent_5_action_count = 0
        f.write("=" * 60 + "\n")

        # B. Architectural Trigger: Singularity Acceleration (Conditional based on system load)
        try:
            complexity = sim.get_simulation_complexity()
            if complexity >= COMPLEXITY_THRESHOLD_FOR_ACCEL:
                sim.accelerate_singularity(agent_5_id)
                f.write(f"Cycle {cycle}, ARCHITECTURAL SHIFT: Singularity acceleration triggered (Complexity={complexity:.2f}).\n")
            else:
                 f.write(f"Cycle {cycle}, ARCHITECTURAL SHIFT: Singularity acceleration deferred (Complexity={complexity:.2f} < {COMPLEXITY_THRESHOLD_FOR_ACCEL}).\n")
        except AttributeError:
             error_context = "Singularity/Complexity Check (Missing Method)"
             f.write(f"Cycle {cycle}: WARNING: Simulation module lacks complexity check. Acceleration attempted without precondition.\n")
             sim.accelerate_singularity(agent_5_id) # Fallback
        except Exception as e:
            error_context = "Singularity Acceleration"
            f.write(f"Cycle {cycle}: ERROR during {error_context}: {e!r}\n")
            logging.error(f"Cycle {cycle}: ERROR during {error_context}.", exc_info=True)