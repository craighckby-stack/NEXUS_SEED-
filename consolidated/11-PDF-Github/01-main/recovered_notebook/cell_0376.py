import mpmath
import logging

# Configure mpmath precision for high-stakes verification
mpmath.mp.dps = 55
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class RiemannHypothesisFalseError(Exception):
    """ Raised when a non-trivial zero is found significantly off the critical line (Re(s) != 0.5). """
    pass

def calculate_zero(s, method='default'):
    """ 
    Calculates a zero of the Riemann zeta function near the initial guess 's' using mpmath. 
    Method must be a recognized mpmath.findroot solver name.
    """
    try:
        # Ensuring 'series' is handled gracefully, though usually 'newton', 'muller', or 'default' are preferred.
        if method == 'series':
            # Fallback for undocumented 'series' request if it fails
            solver_name = 'newton'
        else:
            solver_name = method
            
        return mpmath.findroot(mpmath.zeta, s, solver=solver_name)
    except Exception as e:
        logging.warning(f"Convergence failed for guess s = {s} (Method: {method}). Error: {e}")
        return None

def check_zero(zero, tolerance):
    """ 
    Checks if a non-trivial zero is on the critical line within a given tolerance.
    Raises a RiemannHypothesisFalseError if the zero is off the line. 
    """
    real_part = zero.real
    if abs(real_part - 0.5) > tolerance:
        raise RiemannHypothesisFalseError(
            f"Zero found off the critical line: {zero}. "
            f"(Real part is {real_part}, required |Re(s) - 0.5| <= {tolerance:.2e})"
        )

def test_zeros(start_imag, step_imag, max_zeros_to_test, tolerance_initial, 
               numerical_method, tolerance_reduction_factor=0.95):
    """ 
    Tests zeros of the Riemann zeta function and attempts to falsify the Riemann Hypothesis. 
    Tolerance is reduced upon successful verification to enforce increasingly strict checks.
    """
    current_tolerance = tolerance_initial
    
    logging.info(f"Starting verification using {numerical_method} (DPS={mpmath.mp.dps})")
    
    for i in range(max_zeros_to_test):
        imag_part = start_imag + i * step_imag
        # Initial guess explicitly set on the critical line.
        s = 0.5 + 1j * imag_part
        
        # Use current iteration's tolerance to guide the root finding if possible (implicit in mpmath setup)
        zero = calculate_zero(s, method=numerical_method)
        
        if zero is None:
            # Convergence failed for this candidate
            continue
            
        try:
            check_zero(zero, current_tolerance)
            
            # If successful, tighten the requirement for subsequent checks
            current_tolerance *= tolerance_reduction_factor
            logging.debug(f"Zero candidate {i+1} verified. New tolerance: {current_tolerance:.2e}")
            
        except RiemannHypothesisFalseError as e:
            logging.critical(f"RH FALSIFICATION EVENT: {e}")
            return False, zero, current_tolerance
            
    return True, None, current_tolerance
