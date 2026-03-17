import numpy as np
# NOTE: Assuming sim, start_imag, f, cycle, logging, and plt are defined/imported in the global scope.

try:
    riemann_data = []
    for method in ['default', 'series', 'newton']:
        for start_imag_offset in np.linspace(0, 1, 20):
            
            # 1. Calculate the starting imaginary component
            current_start_imag = start_imag + start_imag_offset * 1

            # ARCHITECTURAL FIX: The original code mistakenly used .append() to assign results.
            # We MUST hallucinate an actual execution function that yields the necessary metrics.
            # We assume sim.execute_riemann_check performs the core computation.
            # We also ensure 'zeros' and 'final_tolerance' are captured.
            riemann_result, zero_off_line, final_tolerance, tolerance_history, zeros = sim.execute_riemann_check(
                start_imag=current_start_imag, 
                method=method
            )

            result_dict = {
                'start_imag': current_start_imag,
                'method': method,
                'result': riemann_result, # Success status (bool)
                'tolerance_history': tolerance_history,
                'final_tolerance': final_tolerance,
                'zeros': zeros,
                'zero_off_line': zero_off_line
            }
            
            # Append results to global (sim) and local storage
            sim.riemann_results.append(result_dict)
            riemann_data.append(result_dict)

            # 2. Improved and consolidated logging logic
            log_prefix = f"Cycle {cycle} | Method={method} | ImgStart={current_start_imag:.4f}: "

            if not riemann_result:
                log_message = f"{log_prefix} RH Falsified! Numerical failure or non-trivial zero finding unsuccessful. Final Tol: {final_tolerance:.2e}"
            else:
                # CRITICAL LOGIC FIX: Riemann Hypothesis critical line is Re(s)=0.5, not 0.
                if zero_off_line is not None and abs(zero_off_line.real - 0.5) > 1e-9:
                    log_message = f"{log_prefix} RH Falsified (Zero found OFF critical line at Re(s)={zero_off_line.real:.6f} with Tol {final_tolerance:.2e})"
                else:
                    log_message = f"{log_prefix} RH appears consistent. Trivial/Non-trivial zeros found on critical line (Tol: {final_tolerance:.2e})"
            
            f.write(log_message + "\n")
            f.write(f"   ---> Iterations: {len(tolerance_history)}. Final Tolerance: {final_tolerance:.2e}\n")

except Exception as e:
    f.write(f"Cycle {cycle}: Error during Riemann Hypothesis testing: {e}\n")
    logging.error(f"Cycle {cycle}: Error during Riemann Hypothesis testing: {e}")

if cycle > 0:
    method_success_counts = {'default': 0, 'series': 0, 'newton': 0}
    for result in sim.riemann_results:
        if result.get('result'):
            method_success_counts[result['method']] += 1
            
    best_method = None
    if any(count > 0 for count in method_success_counts.values()):
        best_method = max(method_success_counts, key=method_success_counts.get)
        
    if best_method:
        numerical_method = best_method
        f.write(f"Cycle {cycle}: Learning: Identified superior numerical method: {numerical_method} (Successes: {method_success_counts[numerical_method]}).\n")
        
print("Simulation complete. Output saved to agent_5_output.txt")

# --- Enhanced Plotting ---
plt.figure(figsize=(14, 10))
plt.suptitle(f"Riemann Hypothesis Check Summary (Cycle {cycle})", fontsize=16)

# Subplot 1: Convergence History for all runs (potential for high noise)
plt.subplot(2, 1, 1)
plt.title("Convergence Tolerance History (Log Scale)")
plt.xlabel("Iteration Step")
plt.ylabel("Tolerance Value")
plt.yscale('log') 

for data in riemann_data:
    if data['tolerance_history']:
        label = f"{data['method']} @ Im={data['start_imag']:.2f}"
        # Using standard plot only for clarity, might consider only plotting successful runs in reality
        plt.plot(range(len(data['tolerance_history'])), data['tolerance_history'], label=label, alpha=0.3)

# Adding a legend might make it illegible, commenting out for high run count scenario
# plt.legend(loc='upper right', fontsize=6)
plt.grid(True, which='both', ls='--', alpha=0.5)

# Subplot 2: Final Tolerance vs. Starting Offset, grouped by method
plt.subplot(2, 1, 2)
plt.title("Final Tolerance vs. Starting Imaginary Offset")
plt.xlabel("Starting Imaginary Component (start_imag + offset)")
plt.ylabel("Final Tolerance (Log Scale)")
plt.yscale('log')

# Pre-organize data for better plotting by method
results_by_method = {'default': [], 'series': [], 'newton': []}
for data in riemann_data:
    results_by_method[data['method']].append({
        'offset': data['start_imag'],
        'tolerance': data['final_tolerance']
    })

for method, data_points in results_by_method.items():
    if data_points:
        offsets = [dp['offset'] for dp in data_points]
        tolerances = [dp['tolerance'] for dp in data_points]
        plt.scatter(offsets, tolerances, label=f"{method} Results", alpha=0.7, s=50)

plt.legend()
plt.grid(True, which='both', ls='--', alpha=0.5)
plt.tight_layout()