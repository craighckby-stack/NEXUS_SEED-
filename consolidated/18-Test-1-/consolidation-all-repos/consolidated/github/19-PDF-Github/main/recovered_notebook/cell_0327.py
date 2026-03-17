```python
try:
    # Log cloning events
    if agent_5_id in sim.agents and len(sim.agents) > 5:
        f.write(f"Cycle {cycle}, Agent {agent_5_id} cloned itself.\n")

    if cycle % log_interval == 0:
        try:
            ethical_report = sim.execute_global_ethical_review()
            f.write(f"Cycle {cycle}: Ethical Audit Results: {ethical_report}\n")
        except Exception as e:
            f.write(f"Cycle {cycle}: Error during ethical audit: {e}\n")
            logging.error(f"Cycle {cycle}: Error during ethical audit: {e}")

    # Log Agent 5 actions less frequently
    f.write(f"Cycle {cycle}, Agent 5 Action Count: {agent_5_action_count}\n")
    agent_5_action_count = 0  # reset
    f.write("-" * 20 + "\n")  # Separator between cycles

    # --- New actions in the main loop, for Agents ---
    if cycle % 151 == 0:  # Shifted the cycle to avoid potential conflicts
        try:
            sim.accelerate_singularity(agent_5_id)
        except Exception as e:
            f.write(f"Cycle {cycle}: Error during singularity acceleration: {e}")
            logging.error(f"Cycle {cycle}: Error during singularity acceleration: {e}")

    if cycle % 251 == 0:  # Shifted the cycle to avoid potential conflicts
        try:
            sim.create_temporal_paradox()
        except Exception as e:
            f.write(f"Cycle {cycle}: Error during temporal paradox creation: {e}")
            logging.error(f"Cycle {cycle}: Error during temporal paradox creation: {e}")

except Exception as e:
    logging.error(f"An unexpected error occurred: {e}")
    print(f"An unexpected error occurred: {e}")

print("Simulation complete. Output saved to agent_5_output.txt")

# 
# Multiverse collision detected! Creating alternate timeline...
# Multiverse collision detected! Creating alternate timeline...
# Multiverse collision detected! Creating alternate timeline...
# Multiverse collision detected! Creating alternate timeline...
```