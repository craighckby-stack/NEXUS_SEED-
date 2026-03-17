import json
from typing import Dict, Any, List

# Define type aliases for clarity and structure
Cell = Dict[str, Any]
Notebook = Dict[str, Any]


def simulate_cell_recovery(cell_id: int, status: str) -> Cell:
    """Creates a simulated recovered cell object with rich metadata."""
    return {
        "cell_id": f"c_{cell_id:04d}",
        "type": "code",
        "content_preview": f"print('Execution content for run {cell_id}')",
        "execution_status": status,
        "runtime_ms": 150 + (cell_id * 10) if status == "Success" else 0,
        "logs": [f"Runtime output line 1 for cell {cell_id}."],
    }


def recover_notebook() -> Notebook:
    """
    Recovers the state of a notebook, structuring the output data.
    This function is responsible for data extraction and assembly.
    """
    
    print("Sovereign AGI: Starting structured notebook recovery process...")
    
    # 1. Simulate data extraction of cells
    recovered_cells: List[Cell] = [
        simulate_cell_recovery(1, "Success"),
        simulate_cell_recovery(2, "Failure"),
        simulate_cell_recovery(3, "Success"),
        simulate_cell_recovery(4, "Skipped"),
    ]

    # 2. Assemble the final structured notebook data
    notebook_data = {
        "metadata": {
            "version": "v94.1_evolution",
            "recovery_timestamp": "2024-06-15T12:00:00Z",
            "source_id": "recovered_notebook_0055_source"
        },
        "cells": recovered_cells,
        "summary": {
            "total_cells": len(recovered_cells),
            "successful_runs": sum(1 for c in recovered_cells if c["execution_status"] == "Success"),
            "first_failure_index": next((i for i, c in enumerate(recovered_cells) if c["execution_status"] == "Failure"), -1)
        }
    }

    print("Sovereign AGI: Notebook structured data recovered.")
    return notebook_data


def log_notebook_state(data: Notebook):
    """Logs the structured notebook state using formatted, human-readable output."""
    print("\n--- Notebook Recovery Log ---")
    print(f"Source ID: {data['metadata']['source_id']}")
    print(f"Recovery Time: {data['metadata']['recovery_timestamp']}")
    print(f"Total Cells: {data['summary']['total_cells']}")
    print(f"Successful Executions: {data['summary']['successful_runs']}")
    
    print("\nCell Execution Details:")
    for cell in data["cells"]:
        status_tag = f"[{cell['execution_status']}]"
        print(f"  {status_tag:<10} | ID={cell['cell_id']} | Runtime={cell['runtime_ms']}ms | Preview: '{cell['content_preview'][:30]}...'\n")
    
    if data['summary']['first_failure_index'] != -1:
         print(f"FAILURE DETECTED: First failure at cell index {data['summary']['first_failure_index']} (Cell ID: {data['cells'][data['summary']['first_failure_index']]['cell_id']})")


if __name__ == "__main__":
    recovered_data = recover_notebook()
    log_notebook_state(recovered_data)