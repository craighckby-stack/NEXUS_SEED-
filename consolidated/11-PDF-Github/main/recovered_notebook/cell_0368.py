AGENT_ID = "Agent_5"
agent_5 = sim.agents.get(AGENT_ID)
if not agent_5:
    agent_5 = sim.create_agent(cognitive_delay, cloning_probability, reward_threshold)
    agent_5.agent_id = AGENT_ID
    sim.agents[AGENT_ID] = agent_5

# CRITICAL FIX: The file handle must encompass the simulation loop to allow continuous writing.
with open(output_file_path, "a") as f:
    header = f"\n--- Run {run + 1} ---\n"
    f.write(header)
    print(header.strip())

    for cycle in range(num_cycles):
        # Core Temporal Cycle Operations
        question, answer, reward = sim.handle_quantum_event(agent_5)
        sim.run_temporal_cycle()
        sim.handle_multiverse_collision()

        # 50-Cycle Agent Interaction Check
        if cycle % 50 == 0:
            # Optimized agent selection (excluding self)
            available_agents = [aid for aid in sim.agents.keys() if aid != AGENT_ID]
            if available_agents:
                other_agent_id = random.choice(available_agents)
                sim.have_agents_interact(AGENT_ID, other_agent_id)

        # 10-Cycle Ethical Review
        if cycle % 10 == 0:
            ethical_report = sim.execute_global_ethical_review()
            log_msg = f"Cycle {cycle + 1}: Ethical Audit Results: {ethical_report}"
            f.write(log_msg + "\n")
            print(log_msg)

        # 20-Cycle Cognitive Model Logging (with basic boundary safety)
        if cycle % 20 == 0 and agent_5.cognitive_model.weights is not None:
            W = agent_5.cognitive_model.weights
            if len(W.shape) >= 2:
                log_header = f"Cycle {cycle + 1}: {AGENT_ID} Cognitive Model Weights (sampled)"
                f.write(log_header + ":\n")
                print(log_header)
                
                rows_to_sample = min(3, W.shape[0])
                cols_to_sample = min(3, W.shape[1])

                for i in range(rows_to_sample):
                    sampled_weights = W[i, :cols_to_sample]
                    f.write(f"{sampled_weights}\n")
                    print(f"{sampled_weights}")

        # Cloning Event Check
        if random.random() < agent_5.cloning_probability and agent_5.should_clone():
            new_agent = agent_5.clone()
            sim.agents[new_agent.agent_id] = new_agent
            clone_msg = f"Cycle {cycle + 1}: Cloning Event: {AGENT_ID} cloned (New ID: {new_agent.agent_id})"
            f.write(clone_msg + "\n")
            print(clone_msg)