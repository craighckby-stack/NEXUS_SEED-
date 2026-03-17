from dataclasses import dataclass, field
from typing import Dict, List
import time

# --- Core Data Structures ---

@dataclass
class Resource:
    """Represents a resource with title, snippet, and URL."""
    title: str
    snippet: str
    url: str

@dataclass
class Interaction:
    """
    Represents an interaction with timestamp, user input, response, and analysis.
    Analysis uses default factory for mutable default.
    """
    timestamp: str
    user_input: str
    response: str
    analysis: Dict[str, str] = field(default_factory=dict)
    
    def __str__(self) -> str:
        analysis_str = '\n    '.join([f"{k}: {v}" for k, v in self.analysis.items()])
        return (
            f"--- Interaction ---\n"
            f"  Time: {self.timestamp}\n"
            f"  Input: {self.user_input}\n"
            f"  Response: {self.response}\n"
            f"  Analysis:\n    {analysis_str}"
        )

# --- Utility and Display ---

def display_output(message: str, level: str = "INFO", **kwargs) -> None:
    """Displays output with the given message, prefixed by level for structure."""
    print(f"[{level}] {message}", **kwargs)

def display_resources(resources: List[Resource]) -> None:
    """Displays resources with enhanced formatting."""
    if resources:
        display_output("[ Resource Catalog ]", level="SYSTEM")
        for i, resource in enumerate(resources):
            print(f"--- R{i+1} ---")
            print(f"  Title: {resource.title}")
            # Truncate snippet for cleaner log view
            print(f"  Snippet: {resource.snippet[:70]}{'...' if len(resource.snippet) > 70 else ''}")
            print(f"  URL: {resource.url}")
        print("--------------------\n")

def display_interaction_log(interaction_log: List[Interaction]) -> None:
    """Displays interaction log using the Interaction's __str__ method."""
    if interaction_log:
        display_output("[ Interaction Log ]", level="SYSTEM")
        for interaction in interaction_log:
            print(str(interaction))
        print("====================")


# --- Simulation Logic ---

def create_interaction(
    user_input: str, 
    response: str, 
    template_key: str, 
    resources: List[Resource] = None
) -> Interaction:
    """Creates a complete Interaction object, replacing the old process_interaction dict function."""
    if resources is None:
        resources = []
        
    analysis = {
        "template_key": template_key,
        "resource_count": str(len(resources))
    }
    
    return Interaction(
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
        user_input=user_input,
        response=response,
        analysis=analysis
    )

def run_simulation(example_resources: List[Resource]) -> List[Interaction]:
    """Runs a structured simulation generating three types of interactions."""
    log = []
    
    # Interaction 1: Greeting
    log.append(create_interaction(
        user_input="hello",
        response="Greetings! I'm ready to answer your questions.",
        template_key="greeting",
    ))
    
    # Interaction 2: Vague input (No resources)
    log.append(create_interaction(
        user_input="What ever you want it to be",
        response="I'm still learning. Can you please rephrase your question?",
        template_key="clarification_needed",
    ))
    
    # Interaction 3: Successful lookup (Using available resources)
    log.append(create_interaction(
        user_input="Tell me about Core Principles",
        response=f"Found information: {example_resources[0].snippet}",
        template_key="lookup_success",
        resources=[example_resources[0]]
    ))
    
    return log

# --- Main Execution ---

def main() -> None:
    # 1. Define foundational resources
    external_resources = [
        Resource(title="Resource 1: Core Principles", snippet="Snippet 1: The Sovereign AGI must adhere to three core principles: Utility, Safety, and Transparency.", url="http://agi.corp/r1"),
        Resource(title="Resource 2: Deployment Guide", snippet="Snippet 2: Deployment guide details version 94.1 compatibility matrix and execution parameters for heterogeneous clusters.", url="http://agi.corp/r2")
    ]
    
    # 2. Display available resources
    display_resources(external_resources)

    # 3. Run simulation based on defined resources
    interaction_log = run_simulation(external_resources)
    
    # 4. Display log results
    display_output(f"SPED System One Status: Simulation completed successfully. Log contains {len(interaction_log)} entries.", level="SUCCESS")
    display_interaction_log(interaction_log)

if __name__ == "__main__":
    main()