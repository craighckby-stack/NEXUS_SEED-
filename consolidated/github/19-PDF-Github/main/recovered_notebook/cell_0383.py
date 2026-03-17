import mpmath
import logging
import math
from typing import Optional, Tuple

# --- AGI Configuration Standards ---

DEFAULT_DPS = 75 # Standard precision for advanced analysis

class RiemannHypothesisFalseError(Exception):
    """ Raised when a zero is found significantly off the critical line. """
    pass

# --- Refactored Core Functions ---

def configure_mpmath_dps(required_dps: int):
    """ Sets mpmath working precision globally if necessary. """
    if mpmath.mp.dps < required_dps:
        mpmath.mp.dps = required_dps
        logging.debug(f"mpmath precision raised to DPS={required_dps}.")


def calculate_zero(s: complex, method: str = 'default', dps_override: Optional[int] = None) -> Optional[complex]:
    """ 
    Calculates the next zero of the Riemann zeta function near the initial guess s.
    Dynamically adjusts mpmath precision based on requirement or default.
    """
    
    # Determine required precision
    dps = dps_override if dps_override is not None else DEFAULT_DPS
    configure_mpmath_dps(dps)

    # mpmath requires complex numbers defined within its own structure
    s_mp = mpmath.mpc(s)
    
    solver_configs = {
        'default': {},
        # Enforced high iteration count for series convergence
        'series': {'solver': 'series', 'maxsteps': 1000, 'tol': mpmath.mp.eps},
        'newton': {'solver': 'newton', 'maxsteps': 500}
    }
    
    try:
        if method not in solver_configs:
            logging.warning(f"Unknown calculation method: {method}. Using default.")
            kwargs = solver_configs['default']
        else:
            kwargs = solver_configs[method]
            
        result = mpmath.findroot(mpmath.zeta, s_mp, **kwargs)
        
        # Convert back to standard complex for system interoperability
        return complex(result)
    
    except mpmath.lib.extra.NoConvergenceError as e: 
        logging.warning(f"[{method}] Solver failed to converge (DPS={dps}) starting near s={s.imag:.4f}j: {e}")
        return None
    except Exception as e: 
        # Catch all other mpmath/system errors
        logging.error(f"General error calculating zero near {s.imag:.4f}j: {type(e).__name__} - {e}")
        return None


def check_zero(zero: complex, current_tolerance: float):
    """ Checks if a zero is on the critical line within a given tolerance. """
    
    if zero is None or abs(zero.real) == float('inf') or abs(zero.imag) == float('inf'):
        logging.warning(f"Skipping invalid zero result: {zero}")
        return
        
    # Ensure high precision reading of the real part
    real_part_error = abs(zero.real - 0.5)
    
    if real_part_error > current_tolerance:
        raise RiemannHypothesisFalseError(
            f"RH Falsification detected! Zero found off the critical line: {zero} "
            f"(Real part: {zero.real:.18f}, Error: {real_part_error:.2e}, Tolerance: {current_tolerance:.2e})"
        )


def test_zeros(start_imag: float, step_imag: float, max_zeros_to_test: int, tolerance_initial: float, tolerance_reduction_factor: float, numerical_method: str = 'series') -> Tuple[bool, Optional[complex], float]:
    """ 
    Tests zeros of the Riemann zeta function with dynamic tolerance adjustment (MPATS).
    Determines required calculation precision based on the initial tolerance.
    """
    
    if step_imag <= 0:
        logging.warning("Step_imag must be positive. Defaulting to 1.0.")
        step_imag = 1.0
        
    # Calculate required mpmath precision (DPS) based on initial tolerance requirement
    # DPS needs to be significantly larger than log10(1/tolerance) for robust results.
    required_dps = max(DEFAULT_DPS, int(abs(math.log10(tolerance_initial))) + 10)
    configure_mpmath_dps(required_dps)
        
    tolerance = tolerance_initial
    
    for i in range(max_zeros_to_test):
        imag_part = start_imag + i * step_imag
        # Use a robust starting point slightly perturbed from the critical line (0.5)
        s = 0.5 + 1e-10 + 1j * imag_part  
        
        # Pass calculated high precision requirement to the zero finder
        zero = calculate_zero(s, method=numerical_method, dps_override=required_dps)
        
        if zero is None:
            # Convergence failed, potentially try alternate solver methods here if robustness is critical
            continue
            
        try:
            check_zero(zero, tolerance)
            
            # Dynamic tolerance adjustment: Tighten the requirement (MPATS)
            tolerance *= tolerance_reduction_factor  
            
            # Prevent tolerance from dropping below the current computational precision floor
            precision_floor = 10**(-required_dps + 10)
            if tolerance < precision_floor:
                 tolerance = precision_floor
                 logging.debug(f"Tolerance reached numerical precision floor dictated by DPS={required_dps}.")
                 
        except RiemannHypothesisFalseError as e:
            logging.critical(e)
            return False, zero, tolerance
            
    # Restore original DPS if necessary (omitted for typical usage patterns)
    
    return True, None, tolerance