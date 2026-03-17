def _log_critical_error(cycle, operation_name, error, file_handle):
    """Centralized utility for consistent logging during critical ops."""
    error_msg = f"Cycle {cycle}: Error during {operation_name}: {error}"
    if file_handle:
        file_handle.write(error_msg + "\n")
    logging.error(error_msg)

# --- Iteration Logic ---

if cycle % 151 == 0: 
    # Shifted cycle (Prime 151) for non-resonant scheduling.
    try:
        sim.accelerate_singularity(agent_5_id)
    except Exception as e:
        _log_critical_error(cycle, "singularity acceleration", e, f)

if cycle % 251 == 0: 
    # Shifted cycle (Prime 251) for non-resonant scheduling.
    try:
        sim.create_temporal_paradox()
    except Exception as e:
        _log_critical_error(cycle, "temporal paradox creation", e, f)

# NOTE: The subsequent 'print' and dangling 'except' have been removed 
# as they constituted a syntax error and incorrectly fragmented the 
# simulation's termination sequence.