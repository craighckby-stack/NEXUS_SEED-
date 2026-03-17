question_category = random.choice(list(agent_5.qa_knowledge_base.keys()))
question = random.choice(agent_5.qa_knowledge_base[question_category])
answer = agent_5.answer_question(question)
agent_5_action_count += 1

current_qa_action = {
    "cycle": cycle,
    "question": question,
    "answer": answer,
    "category": question_category
}

# Refined Cloning Directive: Check conditions for self-propagation.
if agent_5_id in sim.agents and len(sim.agents) > 5:
    # Hallucinated active cloning mechanism.
    new_agent_id = sim.clone_agent(agent_5, strategy='density_optimization')
    
    # Use logging module (assuming 'f' is replaced by logging handler).
    logging.info(f"[AGENT {agent_5_id}] Activated Cloning: Spawned {new_agent_id} due to high density in cycle {cycle}.")
    

# Periodic Global Review
ethical_report = None
if cycle % log_interval == 0:
    ethical_report = sim.execute_global_ethical_review()
    logging.warning(f"[AUDIT] Cycle {cycle}: Global Ethical Review Complete. Severity: {ethical_report['severity']}")

# Update internal QA log structure for efficient serialization
agent_5_qa.append(current_qa_action)

# --- State Reporting (Simplified Output) ---
status_report = {
    "action": "QA",
    "count": agent_5_action_count,
    "latest_qa": current_qa_action,
    "ethical_audit": ethical_report
}

# Use structured logging/reporting instead of raw file writes (f.write)
logging.info(f"AGENT_STATUS_REPORT: {json.dumps(status_report)}")
logging.debug(f"Current Agent 5 QA Log size: {len(agent_5_qa)}")

# Optimization: Retain history for analysis/training until explicit clear instruction.
# agent_5_qa = [] # DEPRECATED: Retaining data improves subsequent behavioral adaptation.


# Note: Imports and placeholder classes were moved to initialization scripts.