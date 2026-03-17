import qiskit
from qiskit import QuantumCircuit, execute, Aer
from qiskit.visualization import plot_histogram
import matplotlib.pyplot as plt


def create_entanglement_circuit(num_qubits: int) -> QuantumCircuit:
    """
    Creates a basic entanglement quantum circuit (similar to GHZ preparation).
    Initializes all qubits in superposition and chains CNOT gates for entanglement.
    
    Args:
        num_qubits (int): The number of qubits in the circuit.

    Returns:
        QuantumCircuit: The created quantum circuit.
    """
    # Initialize circuit with N qubits and N classical bits for measurement
    circuit = QuantumCircuit(num_qubits, num_qubits)
    
    # 1. Prepare superposition
    circuit.h(range(num_qubits))
    circuit.barrier(label='Superposition') 
    
    # 2. Entangle via CNOT chain
    for q in range(num_qubits - 1):
        circuit.cx(q, q + 1)
        
    circuit.barrier(label='Entanglement')

    # 3. Measure all qubits onto their corresponding classical bits
    circuit.measure(range(num_qubits), range(num_qubits))
    
    return circuit


def run_quantum_circuit(circuit: QuantumCircuit, shots: int = 1024):
    """
    Runs the quantum circuit using the QASM simulator.

    Args:
        circuit (QuantumCircuit): The quantum circuit to be run.
        shots (int): Number of times to run the circuit.

    Returns:
        dict: A dictionary containing the counts/results of the circuit execution.
    """
    # Use Aer.get_backend directly
    simulator = Aer.get_backend('qasm_simulator')
    
    # Use execute function (Qiskit standard)
    job = execute(circuit, simulator, shots=shots)
    results = job.result()
    return results.get_counts()


def visualize_results(counts):
    """
    Plots the results of the circuit execution using Qiskit's histogram visualization.

    Args:
        counts (dict): A dictionary containing the measurement counts.
    """
    # Leverage Qiskit visualization for clear results
    plot_histogram(counts, title="Quantum Circuit Measurement Results").show()


if __name__ == "__main__":
    # Example Usage
    N_QUBITS = 5
    
    # 1. Create Circuit
    qc = create_entanglement_circuit(N_QUBITS)
    print("\n--- Circuit Description ---")
    print(qc.draw(output='text', fold=-1))
    
    # 2. Run Simulation
    simulation_counts = run_quantum_circuit(qc, shots=2048)
    
    # 3. Plot Results
    visualize_results(simulation_counts)
    
    print("\nSimulation complete.")
