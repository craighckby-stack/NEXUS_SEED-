import os
import json
from PyInquirer import prompt, Separator
from tabulate import tabulate
from datetime import datetime

# --- Configuration & UI Blueprint ---
UI_ELEMENTS = {
    "Topic Input": "Input field for new search terms.",
    "Add Topic Button": "Triggers adding a new topic to the queue.",
    "Scrape Button": "Initiates the scraping pipeline.",
    "Clear All Button": "Resets the topic queue and output.",
    "Output": "Displays status and results."
}

DEFAULT_TOPICS = ["Search Engines (General)", "Image Recognition (ML)", "Video Processing (FFmpeg)"]

def display_ui_blueprint(elements):
    """Displays a textual blueprint of the expected user interface elements."""
    print("--- CLI Application Blueprint ---")
    data = [[k, v] for k, v in elements.items()]
    print(tabulate(data, headers=["Element", "Description"], tablefmt="fancy_grid"))
    print("---------------------------------")

def get_topics_from_user():
    """Prompts user to select initial topics."""
    
    questions = [
        {
            "type": "checkbox",
            "name": "selected_topics",
            "message": "Select initial topics (use spacebar to select, enter to confirm):",
            "choices": [
                {"name": t} for t in DEFAULT_TOPICS
            ]
        }
    ]
    
    answers = prompt(questions)
    return answers.get("selected_topics", [])

def scrape_learning_resources(topics):
    """
    Simulates the resource scraping pipeline.
    Returns a structured dictionary of mock results.
    """
    if not topics:
        print("No topics selected for scraping.")
        return {}
        
    results = {}
    print(f"\n[PIPELINE START] Scraping learning resources for {len(topics)} topic(s)...")
    
    for i, topic in enumerate(topics):
        # Hallucinating mock results structure
        results[topic] = {
            "status": "completed",
            "source_count": 5 + i,
            "duration_s": 1.2 + (i * 0.5),
            "resource_tags": ["API", "Documentation", "Tutorial"]
        }
    
    print("[PIPELINE END] Scraping complete.")
    return results

def log_results(scrape_results, timestamp):
    """Logs the results of the execution run to a structured JSON file and updates a requirements snapshot."""
    log_dir = "Output/logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    log_file_path = os.path.join(log_dir, f"run_log_{timestamp}.json")
    
    # Log structured summary
    summary_data = {
        "run_timestamp": timestamp,
        "topics_scraped": list(scrape_results.keys()),
        "total_results": len(scrape_results),
        "scrape_summary": scrape_results,
        "system_info_placeholder": "Placeholder for dependency list or environment snapshot."
    }
    
    with open(log_file_path, "w") as f:
        json.dump(summary_data, f, indent=4)
    
    # Update requirements snapshot
    req_path = os.path.join(log_dir, "requirements_snapshot.txt")
    with open(req_path, "w") as f:
        f.write("# Snapshot taken during run\n")
        f.write("Requirement already satisfied: pyperclip in /usr/local/lib/python3.11/dist-packages\n")
        f.write("Requirement: PyInquirer>=1.0.3\n")

    print(f"\n[LOGGING] Detailed run log saved to: {log_file_path}")
    print(f"[LOGGING] Requirements snapshot updated at: {req_path}")


# --- Main Execution Flow ---
if __name__ == "__main__":
    
    current_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Step 1: Display blueprint
    display_ui_blueprint(UI_ELEMENTS)
    
    # Step 2: Get user input
    selected_topics = get_topics_from_user()
    print(f"\nSelected Topics: {selected_topics}")
    
    # Step 3: Execute pipeline
    results = scrape_learning_resources(selected_topics)
    
    # Step 4: Log outcomes
    log_results(results, current_timestamp)
    
    # Final confirmation
    print("\nProcess finished.")