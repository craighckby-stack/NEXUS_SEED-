```python
if self.paradox_counter > 20:
    self.temporal_anchor -= 100  # Go back in time.
    logging.info("Time travel attempt. Creating a paradox.")
except Exception as e:
    logging.error(f"Error during temporal paradox creation: {e}")

# --- Main Execution Block ---
if __name__ == "__main__":
    try:
        sim = SimulationEnvironment()
        sim.create_agent("Agent_1")
        sim.create_agent("Agent_2")
        for i in range(3, 6):
            sim.create_agent(f"Agent_{i}")  # create agents 3, 4, and 5

# --- Modified Execution Block ---
agent_5_id = "Agent_5"  # Assuming Agent_5 is created by default, or you can find a way
agent_5_action_count = 0
log_interval = 10  # Save data every 10 cycles. Adjust to balance data vs run time

# Open a text file for writing
with open("agent_5_output.txt", "w") as f:
    # Run for 500 cycles.
    for cycle in range(500):
        try:
            sim.run_temporal_cycle()
            sim.handle_multiverse_collision()
        except Exception as e:
            f.write(f"Cycle {cycle}: Error during main cycle execution: {e}\n")
            logging.error(f"Cycle {cycle}: Error during main cycle execution: {e}")
            break  # Exit the loop on a major error.

# --- Capture Agent_5's Actions, Questions, and Answers ---
if agent_5_id in sim.agents:
    agent_5 = sim.agents[agent_5_id]
    try:
        # Simulate Agent_5 asking a question and receiving an answer:
        question_category = random.choice(list(agent_5.qa_knowledge_base.keys()))
        question = random.choice(agent_5.qa_knowledge_base[question_category])
        f.write(f"Cycle {cycle}, Agent_5: Asking question: {question} in category {question_category}\n")
        answer = agent_5.answer_question(question)
        f.write(f"Cycle {cycle}, Agent_5: Received answer: {answer}\n")
        # Log cloning or other actions here if needed
        agent_5_action_count += 1  # Count actions
    except Exception as e:
        f.write(f"Cycle {cycle}: Error during Agent_5 interaction: {e}\n")
        logging.error(f"Cycle {cycle}: Error during Agent_5 interaction: {e}")

'''
# Example output/logs:
# Time travel attempt. Creating a paradox.
# Cycle 10, Agent_5: Asking question: What is the meaning of life? in category Philosophy
# Cycle 10, Agent_5: Received answer: The answer to the ultimate question of life, the universe, and everything is 42.
# Cycle 20: Error during main cycle execution: SimulationEnvironmentError('Temporal paradox detected')
'''
```