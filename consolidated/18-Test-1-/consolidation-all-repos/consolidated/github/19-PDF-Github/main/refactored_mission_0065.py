import logging
from typing import List, Dict, Any, Type, Union

# Configure logging to display messages with a timestamp and level
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Architectural Constants and Schemas ---

ARCHITECTURAL_GOALS_SCHEMA: Dict[str, Type] = {
    "goal_id": int,
    "priority": str,  # High, Medium, Low
    "status": str,    # Evolving, Stable, Deprecated
    "description": str,
    "evolution_metric": float, # Percentage or score (0.0 to 1.0)
}

DEFAULT_ARCHITECTURAL_GOALS: List[Dict] = [
    {
        "goal_id": 1001,
        "priority": "High",
        "status": "Stable",
        "description": "Ensure 99.99% uptime via self-healing cluster configuration.",
        "evolution_metric": 0.98,
    },
    {
        "goal_id": 1002,
        "priority": "High",
        "status": "Evolving",
        "description": "Minimize cross-service latency below 50ms via optimization layer.",
        "evolution_metric": 0.65,
    },
    {
        "goal_id": 1003,
        "priority": "Medium",
        "status": "Deprecated",
        "description": "Maintain compatibility with legacy v1 API structure until migration completion.",
        "evolution_metric": 1.0,
    }
]

# --- Validation Helper ---

def _validate_goals(goals: List[Dict[str, Any]], schema: Dict[str, Type]) -> List[Dict[str, Any]]:
    """Validates the structure and types of the architectural goals against the schema."""
    validated_goals = []
    for i, goal in enumerate(goals):
        current_goal_id = goal.get('goal_id', f'Index_{i}')
        is_valid = True
        
        # 1. Check for missing/extra keys
        if set(goal.keys()) != set(schema.keys()):
            logging.warning(f"Validation failed for Goal {current_goal_id}: Key set mismatch.")
            is_valid = False

        if is_valid:
            # 2. Check types
            for key, expected_type in schema.items():
                if not isinstance(goal.get(key), expected_type):
                    logging.warning(
                        f"Validation failed for Goal {current_goal_id}: Key '{key}' type mismatch (Expected {expected_type.__name__}, Got {type(goal.get(key)).__name__})."
                    )
                    is_valid = False
                    break
        
        if is_valid:
            validated_goals.append(goal)
            
    if len(validated_goals) < len(goals):
        logging.info(f"Filtered {len(goals) - len(validated_goals)} invalid architectural goals during runtime validation.")
        
    return validated_goals

# --- Primary Mission Function ---

def mission_0065() -> List[Dict[str, Union[int, str, float]]]:
    """
    Retrieves and validates architectural goals data.
    Simulates loading critical mission goals from a trusted configuration source.

    Returns:
        List[Dict]: A validated list of architectural goals data.
    """
    logging.info("Initiating Mission 0065: Retrieving Architectural Goals.")
    try:
        # 1. Retrieve raw data (simulated access to configuration store)
        raw_goals = DEFAULT_ARCHITECTURAL_GOALS
        
        # 2. Architectural Resilience: Validate data structure and integrity
        goals = _validate_goals(raw_goals, ARCHITECTURAL_GOALS_SCHEMA)

        if not goals:
            logging.warning("Mission 0065 completed, but no valid architectural goals were retrieved.")
            return []
            
        logging.info(f"Mission 0065 successful: Loaded {len(goals)} validated architectural goals.")
        return goals
        
    except Exception as e:
        logging.critical(f"Mission 0065 Critical Infrastructure Failure: Failed to process goals. Error: {e}", exc_info=True)
        # Fail safe on infrastructure error
        return []

if __name__ == '__main__':
    print("\n--- Mission Results ---")
    results = mission_0065()
    import json
    print(json.dumps(results, indent=2))
