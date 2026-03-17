import mpmath as mp
import logging
import matplotlib.pyplot as plt

# --- Configuration Constants ---
DEFAULT_DPS = 50 # Default Decimal Places of Precision

# --- Core Functionality ---
def analyze_zeta_zeros(max_zeros_to_test, tolerance=1e-17, numerical_method='default', precision_dps=DEFAULT_DPS):
    """Calculates the first N zeta zeros, checks the Riemann Hypothesis (RH) condition, 
    and returns structured results.
    """
    # Set precision crucial for numerical verification
    mp.mp.dps = precision_dps
    logging.info(f"Analyzing RH up to {max_zeros_to_test} zeros. DPS: {precision_dps}, Tolerance: {tolerance:.2e}.")

    real_parts = []
    imag_parts = []
    failed_zeros = []
    is_rh_satisfied = True

    for i in range(1, max_zeros_to_test + 1):
        try:
            if numerical_method == 'default':
                zero = mp.zetazero(i)
            elif numerical_method == 'series':
                zero = mp.zetazero(i, method='series')
            elif numerical_method == 'newton':
                zero = mp.zetazero(i, method='newton')
            else:
                raise ValueError(f"Unknown numerical method: {numerical_method}")
            
            r, im = zero.real, zero.imag
            real_parts.append(float(r))
            imag_parts.append(float(im))
            
            deviation = abs(r - 0.5)

            if deviation > tolerance:
                is_rh_satisfied = False
                # Store full zero information if it fails the check
                failed_zeros.append({
                    'index': i,
                    'real': float(r),
                    'imag': float(im),
                    'deviation': float(deviation)
                })
                logging.warning(f"Zero {i}: Real part = {r} | Deviation: {deviation:.2e} (Exceeds tolerance {tolerance:.2e}).")
        
        except Exception as e:
            logging.error(f"Error calculating zero {i}: {e}")
            return {"success": False, "rh_test_result": "Error during calculation", "details": str(e)}
            
    return {
        "success": True,
        "rh_test_satisfied": is_rh_satisfied,
        "count_tested": max_zeros_to_test,
        "failed_count": len(failed_zeros),
        "failed_zeros": failed_zeros,
        "real_parts": real_parts,
        "imag_parts": imag_parts,
        "precision_dps": precision_dps
    }

# --- Visualization Function ---
def visualize_results(results, tolerance, filename='zeta_zeros_analysis.png'):
    if not results['success'] or not results['imag_parts']:
        logging.warning("No data or unsuccessful run for visualization.")
        return

    R = results['real_parts']
    I = results['imag_parts']
    indices = list(range(1, results['count_tested'] + 1))

    plt.figure(figsize=(14, 6))

    # Plot 1: Deviation from 0.5 (Log Scale)
    deviations = [abs(r - 0.5) for r in R]
    plt.subplot(1, 2, 1)
    plt.plot(indices, deviations, 'o', markersize=3, label='|Re(z_n) - 0.5|')
    plt.axhline(tolerance, color='r', linestyle='--', label=f'Tolerance ({tolerance:.1e})')
    plt.title(f'Deviation from 0.5 (N={results["count_tested"]})')
    plt.xlabel('Zero Index (n)')
    plt.ylabel('Deviation')
    plt.yscale('log')
    plt.grid(True, which="both", ls="--")
    plt.legend()

    # Plot 2: Imaginary parts
    plt.subplot(1, 2, 2)
    plt.plot(indices, I, 'x-')
    plt.title('Imaginary Parts of Zeros (Growth)')
    plt.xlabel('Zero Index (n)')
    plt.ylabel('Im(z_n)')
    plt.grid(True)

    plt.tight_layout()
    plt.savefig(filename)
    logging.info(f"Visualization saved to {filename}")


# --- Execution Block ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', filename='zeta_zeros_log.txt', filemode='w')

MAX_ZEROS_TO_TEST = 20
TEST_TOLERANCE = 1e-25 
TEST_DPS = 40 # Using custom precision

results = analyze_zeta_zeros(
    max_zeros_to_test=MAX_ZEROS_TO_TEST,
    tolerance=TEST_TOLERANCE,
    precision_dps=TEST_DPS
)

if results['success']:
    print(f"\n--- Analysis Complete (N={MAX_ZEROS_TO_TEST}, DPS={TEST_DPS}) ---")
    print(f"RH Satisfied (within tolerance {TEST_TOLERANCE:.2e}): {results['rh_test_satisfied']}")
    if results['failed_count'] > 0:
        print(f"WARNING: {results['failed_count']} zeros failed the check.")
    
    visualize_results(results, tolerance=TEST_TOLERANCE)
else:
    print(f"FATAL ERROR: {results['details']}")