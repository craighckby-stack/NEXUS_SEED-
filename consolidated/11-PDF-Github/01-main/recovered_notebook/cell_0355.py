import random
# NOTE: Assuming _agent(...) implicitly initializes or returns agent_5 which is then used below.
# Best practice recommends explicit assignment: agent_5 = _agent(...)

_agent(cognitive_delay, cloning_probability, reward_thresho)
agent_5.agent_id = "Agent_5"
sim.agents["Agent_5"] = agent_5

# FIX: Wrap the simulation loop within a single file context manager (f).
try:
    with open(output_file_path, "a") as f:
        f.write(f"\n--- Run {run + 1} (START) ---\n")

        for cycle in range(num_cycles):
            current_cycle = cycle + 1
            question, answer, reward = sim.handle_quantum_event(agent_5)
            sim.run_temporal_cycle()
            sim.handle_multiverse_collision()

            if current_cycle % 10 == 0:
                ethical_report = sim.execute_global_ethical_review()
                f.write(f"[AUDIT:{current_cycle:04d}] Ethical Review: {ethical_report}\n")

            # Improved weights logging (sampled top 3x3 if available, error handling added)
            if agent_5.cognitive_model.weights is not None and current_cycle % 20 == 0:
                try:
                    weights_sample = agent_5.cognitive_model.weights[:3, :3] # Assuming numpy/tensor access
                    f.write(f"[MODEL:{current_cycle:04d}] Weights Sample (3x3):\n")
                    # Log array in a single condensed line for cleaner logs
                    f.write(f"  {str(weights_sample).replace(chr(10), ' | ')}\n")
                except Exception as e:
                    f.write(f"[ERROR:{current_cycle:04d}] Failed to sample weights: {e}\n")

            if random.random() < agent_5.cloning_probability and agent_5.should_clone():
                new_agent = agent_5.clone()
                sim.agents[new_agent.agent_id] = new_agent
                f.write(f"[CLONE:{current_cycle:04d}] {agent_5.agent_id} cloned -> {new_agent.agent_id}\n")

            if question or answer:
                # Reduced logging verbosity for routine Q/A events
                agent_5.successes += 1
                f.write(f"[EVENT:{current_cycle:04d}] R={reward:.4f} (Q/A Successful, Total={agent_5.successes})\n")

        f.write(f"--- Run {run + 1} (END) ---\n")

except Exception as e:
    print(f"CRITICAL SIMULATION ERROR during Run {run + 1}: {e}")

# Original prints moved outside the file context manager
print(f"Run {run + 1} complete.")
print(f"Simulation complete. Results written to {output_file_path}")