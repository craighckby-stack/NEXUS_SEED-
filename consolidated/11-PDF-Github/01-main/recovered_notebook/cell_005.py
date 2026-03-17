import time
import psutil
from concurrent.futures import ThreadPoolExecutor
import matplotlib.pyplot as plt
from qiskit import QuantumCircuit, Aer, execute


class QuantumZeroAnalyzer:
    def __init__(self, qubits=8):
        """Initialize QuantumZeroAnalyzer with qubits count. Now prepares a uniform superposition state."""
        self.qc = QuantumCircuit(qubits, qubits)
        # Improve: Prepare uniform superposition (Hadamard on all qubits)
        for i in range(qubits):
            self.qc.h(i)
            
        self.qc.measure_all()
        self.simulator = Aer.get_backend('qasm_simulator')

    def analyze_quantum_zero_state(self) -> dict:
        """Analyze quantum uniform superposition state and return measurement counts."""
        job = execute(self.qc, self.simulator, shots=1024)
        result = job.result()
        counts = result.get_counts(self.qc)
        self._plot_measurement_counts(counts)
        return counts

    def _plot_measurement_counts(self, counts: dict):
        """Plot measurement counts."""
        plt.figure(figsize=(10, 5))
        plt.bar(counts.keys(), counts.values())
        plt.title("Quantum Superposition State Measurement (Uniform Distribution)")
        plt.xlabel("State")
        plt.ylabel("Count")
        plt.show()


class SecureEraser:
    def secure_erase(self, filename: str) -> str:
        """Simulate secure erase operation (I/O bound simulation)."""
        time.sleep(0.1)
        return f"Erased {filename}"


class HybridOrchestrator:
    def __init__(self):
        """Initialize HybridOrchestrator, using ThreadPoolExecutor for concurrency."""
        # Refactor: Replace incorrect 'as_completed' reference with a proper ThreadPoolExecutor
        self.executor_pool = ThreadPoolExecutor(max_workers=4)
        self.analyzer = QuantumZeroAnalyzer()
        self.eraser = SecureEraser()

    def execute_hybrid_task(self, iterations: int = 3) -> list[float]:
        """Execute hybrid task concurrently (classical erase + quantum analysis) and return latency data."""
        latency_data = []
        future_tasks = []

        # Step 1: Submit all concurrent tasks
        for i in range(iterations):
            start_time = time.time()
            
            # Submit classical erase task
            erase_future = self.executor_pool.submit(self.eraser.secure_erase, f"testfile_{i}.txt")
            
            # Submit quantum simulation task
            quantum_future = self.executor_pool.submit(self.analyzer.analyze_quantum_zero_state)
            
            future_tasks.append((start_time, i, erase_future, quantum_future))

        # Step 2: Retrieve results and measure collective latency for each iteration
        print("--- Starting Concurrent Task Retrieval ---")
        for start_time, i, erase_future, quantum_future in future_tasks:
            
            # Block until both concurrent futures are complete
            erase_result = erase_future.result()
            quantum_results = quantum_future.result()
            
            latency = time.time() - start_time
            latency_data.append(latency)
            
            # Capture instantaneous CPU usage right after heavy processing
            cpu_usage = psutil.cpu_percent(interval=None)
            
            print(f"Iteration {i+1}: Result: {erase_result}, Tasks completed in {latency:.4f}s. CPU: {cpu_usage}%")
            
        # Ensure the executor is cleanly shut down after batch processing
        self.executor_pool.shutdown(wait=True)
        return latency_data

    def visualize_latency(self, data: list[float]) -> None:
        """Visualize latency profile."""
        plt.plot(data, marker='o')
        plt.title("Hybrid Concurrent System Latency Profile")
        plt.xlabel("Iteration")
        plt.ylabel("Latency (seconds)")
        plt.grid(True)
        plt.show()

# Example Usage
orchestrator = HybridOrchestrator()
latency_profile = orchestrator.execute_hybrid_task()
orchestrator.visualize_latency(latency_profile)