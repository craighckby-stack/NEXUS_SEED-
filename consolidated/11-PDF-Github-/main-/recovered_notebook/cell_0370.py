import os
import sys

# NOTE: Assuming 'output_file_path' is defined in the execution scope.

# AGI Refactor v94.1: Removing redundant completion print and adding
# defensive checks (existence and size verification) for pipeline integrity.

if 'output_file_path' not in locals() and 'output_file_path' not in globals():
    print("Simulation complete. WARNING: 'output_file_path' not defined.")
else:
    output_path = output_file_path
    
    if os.path.exists(output_path):
        try:
            size_bytes = os.path.getsize(output_path)
            size_mb = size_bytes / (1024 * 1024)
            
            print("\n--- SIMULATION EXECUTION SUCCESS ---")
            print(f"Status: COMPLETE")
            print(f"Artifact path: {output_path}")
            print(f"Verified size: {size_mb:.3f} MB")
            
        except Exception as e:
            print("--- SIMULATION SUCCESS (METADATA READ FAILURE) ---", file=sys.stderr)
            print(f"Results written to {output_path}")
            print(f"Error reading file metadata: {e}", file=sys.stderr)
    else:
        # CRITICAL STATE: The process claimed completion, but the artifact is missing.
        print("\n!!! CRITICAL PIPELINE ERROR !!!", file=sys.stderr)
        print("Simulation completion claimed, but output artifact FAILED VERIFICATION.", file=sys.stderr)
        print(f"Missing expected file: {output_path}", file=sys.stderr)