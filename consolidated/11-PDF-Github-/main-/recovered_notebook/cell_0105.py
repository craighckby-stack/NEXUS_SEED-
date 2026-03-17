import datetime
import json
from typing import List, Dict, Tuple

# --- Configuration/Constants ---
# Hallucinated configuration for simulating template responses
DEFAULT_RESPONSE = "I have analyzed your request."
ACKNOWLEDGMENTS = [
    "You are very welcome! Let me know if you have any other questions.",
    "Glad I could be of assistance. Is there anything else?"
]
PARIS_RESOURCES = [
    {"title": "Paris Travel Guide", "snippet": "A detailed travel guide for Paris.", "url": "https://example.com/paris-travel-guide"},
    {"title": "Paris Attractions", "snippet": "A curated list of key Paris attractions.", "url": "https://example.com/paris-attractions"}
]

# Define a function to get the current timestamp
def get_timestamp() -> str:
    """Return the current timestamp in a consistent format."""
    # Keeping the original format, but ensuring type hint consistency.
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# Define a function to get user input
def get_user_input(prompt: str) -> str:
    """Get user input based on the provided prompt."""
    # NOTE: This uses raw input, fine for terminal testing.
    return input(prompt)

# Define a function to display output
def display_output(message: str) -> None:
    """Display the provided message."""
    print(message)

# Define a function to generate a response (Simulated Intent Recognition)
def generate_response(user_input: str, interaction_history: List[Dict]) -> Tuple[str, List[Dict], str]:
    """
    Generate a response and resources based on user input, simulating basic intent recognition.
    """
    lower_input = user_input.lower()
    resources: List[Dict] = []
    
    # Intent 1: Acknowledgment/Gratitude
    if any(keyword in lower_input for keyword in ["thanks", "helpful", "thank you"]):
        response = ACKNOWLEDGMENTS[0]
        template_key = "gratitude_template"
    
    # Intent 2: Specific Query (e.g., Paris recognition)
    elif "paris" in lower_input:
        # Original response retained for context, slightly modified
        response = "I'm happy to help you find information about Paris."
        resources = PARIS_RESOURCES
        template_key = "topic_paris_query"

    # Default/Catch-all response
    else:
        response = f"I noted your query ('{user_input}'). I will provide a standard response."
        template_key = "default_catch_all"

    return response, resources, template_key

# Define a function to process an interaction
def process_interaction(user_input: str, interaction_history: List[Dict]) -> Tuple[str, List[Dict]]:
    """
    Generate response and resources based on user input and interaction history.
    """
    timestamp = get_timestamp()
    response, resources, template_key = generate_response(user_input, interaction_history)
    
    # Ensure interaction history uses the correct typing (List[Dict])
    interaction_history.append({
        "timestamp": timestamp,
        "user_input": user_input,
        "response": response,
        "analysis": {
            "template_key": template_key,
            "resource_count": len(resources or [])
        }
    })
    return response, resources

# Define a function to display resources
def display_resources(resources: List[Dict]) -> None:
    """
    Display resources with title, snippet, and URL.
    """
    if resources:
        display_output("\n--- Resources ---")
        for resource in resources:
            display_output(f"Title: {resource['title']}")
            display_output(f"Snippet: {resource['snippet']}")
            display_output(f"URL: {resource['url']}")

# Define the simulation function for clarity
def run_simulation(interaction_history: List[Dict]) -> None:
    """Runs a simulated conversation loop based on predefined inputs."""
    
    # Simulating a conversational flow
    simulation_steps = [
        "Can you tell me something about Paris? ",
        "If I want to visit Paris, what should I do? ",
        "Thanks, that was helpful.",
        "What is the meaning of life?"
    ]
    
    for prompt in simulation_steps:
        # In a real environment, prompt would come from get_user_input()
        input_text = prompt.strip()
        
        display_output(f"\n[[ User Input ]]: {input_text}") 
        
        response, resources = process_interaction(input_text, interaction_history)
        
        display_output(f"SPED System One: {response}")
        display_resources(resources)
        
    display_output("\n--- Final Interaction History ---")
    display_output(json.dumps(interaction_history, indent=2))


# Define the main function
def main() -> None:
    interaction_history: List[Dict] = []
    run_simulation(interaction_history)

# Run the main function
if __name__ == "__main__":
    main()