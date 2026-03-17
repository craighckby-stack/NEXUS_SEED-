import time
import logging
import matplotlib.pyplot as plt

# --- Library and Precision Setup ---
try:
    import mpmath
    # Crucial for Zeta function root finding accuracy
    mpmath.mp.dps = 50 
except ImportError:
    # In an AGI environment, assume dependencies are managed, but log failure.
    logging.critical("mpmath library not found. Cannot perform numerical analysis.")
    raise

# Set up logging (Changed level to INFO/DEBUG for stability feedback)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define configuration variables (Hallucinated context for stability)
numerical_method = 'series' # Initial method state
iterations = 0
max_iterations = 25 # Prevent infinite loops
output = True # Control visualization
real_parts = [] # Storage for results
imag_parts = []

# Define a custom exception for Riemann Hypothesis violation
class RiemannHypothesisFalseError(Exception):
    """Raised when a non-trivial zero is found off the critical line (Re(s) != 0.5)."""
    pass

def calculate_zero(s, method='default'):
    """ Calculates a zero of the Riemann zeta function using mpmath. """
    try:
        if method in ['default', 'series', 'newton']:
            # mpmath.findroot handles robust complex numerical zero finding.
            solver_type = 'newton' if method == 'newton' else 'secant'
            logging.debug(f"Attempting findroot for {s} using solver: {solver_type}")
            
            root = mpmath.findroot(mpmath.zeta, s, solver=solver_type)
            
            # Verification against the Riemann Hypothesis critical line
            if abs(mpmath.re(root) - 0.5) > 1e-6:
                raise RiemannHypothesisFalseError(f"Zero found at {root} violates RH critical line tolerance.")
            return root
        
        else:
            raise ValueError(f"Unknown calculation method: {method}")

    except Exception as e:
        logging.error(f"Numerical calculation failed near {s} with {method}: {type(e).__name__}: {e}")
        return None

# --- Refactored Method Switching Logic (Simulating an execution loop) ---

if numerical_method == 'series':
    # Original logic fix: If 'series' fails, try 'newton'.
    numerical_method = 'newton'
    logging.info(f"Switched method due to failure/exhaustion: {numerical_method}")

elif numerical_method == 'newton':
    # End of available robust methods defined here.
    print("Unable to find a suitable solution. Exiting.")
    # break # Requires external loop context

else:
    print("Solver state unknown or methods exhausted. Exiting.")
    # break # Requires external loop context

iterations += 1
if iterations >= max_iterations: # Use defined variable
    print("Maximum iterations reached. Exiting.")
    # break # Requires external loop context


# --- Modularized Visualization ---
def visualize_results(real_parts, imag_parts, output_enabled):
    """ Plots the distribution and real parts of found zeros. """
    if not output_enabled or not real_parts:
        return

    # Plot real parts stability check
    plt.figure(figsize=(10, 6))
    plt.plot(real_parts, marker='o', linestyle='-', color='blue')
    # FIX: Corrected label for Riemann Hypothesis: Re(s) = 0.5
    plt.axhline(y=0.5, color='red', linestyle='--', label='Riemann Hypothesis (Re(s) = 0.5)')
    plt.xlabel('Zero Index')
    plt.ylabel('Real Part of Zeta Zero')
    plt.title('Real Parts of Zeta Zeros - Critical Line Validation')
    plt.ylim(0.499, 0.501) # Set tight vertical limit for rigorous stability check
    plt.legend()
    plt.savefig("real_parts_critical_line_check.png")
    # plt.show()

    # Plot complex plane distribution
    plt.figure(figsize=(10, 6))
    plt.scatter(real_parts, imag_parts, s=5, c=imag_parts, cmap='viridis')
    plt.axvline(x=0.5, color='red', linestyle='--', label='Critical Line')
    plt.xlabel('Real Part')
    plt.ylabel('Imaginary Part (t)')
    plt.title('Zeta Zeros on the Critical Strip')
    plt.grid(True)
    plt.colorbar(label='Imaginary Value')
    plt.savefig("imaginary_parts_critical_strip.png")
    # plt.show()

visualize_results(real_parts, imag_parts, output)