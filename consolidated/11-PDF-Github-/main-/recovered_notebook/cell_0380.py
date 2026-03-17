import logging
import mpmath
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define custom exceptions
class RiemannHypothesisFalseError(Exception):
    pass

class ZeroVerificationError(Exception):
    pass

# --- Architectural Abstraction: Numerical Backend ---

class ZetaSolverBackend:
    """Interface for high-precision zeta function zero finding, decoupling mpmath dependence."""
    def set_precision(self, dps):
        raise NotImplementedError

    def get_gram_approximation(self, N):
        raise NotImplementedError

    def calculate_zeta(self, s):
        raise NotImplementedError

    def find_zero(self, initial_guess, tolerance, method='muller'):
        raise NotImplementedError

class MPMathZetaSolver(ZetaSolverBackend):
    """Concrete implementation using the mpmath library."""
    def __init__(self, dps):
        self.dps = dps
        # Set mpmath precision globally as it affects all complex number operations
        mpmath.mp.dps = dps

    def set_precision(self, dps):
        if self.dps != dps:
            self.dps = dps
            mpmath.mp.dps = dps
            logging.warning(f"Precision dynamically increased to DPS={dps}")

    def get_gram_approximation(self, N):
        L_N = mpmath.mpf(2) * mpmath.pi * (mpmath.mpf(N) + mpmath.mpf(0.875))
        
        # Initial estimate T0
        T0 = L_N / mpmath.log(L_N)
        
        # Refined estimate using Newton iteration (simplified form)
        log_L_N = mpmath.log(L_N)
        T_approx = T0 * (1 + (mpmath.log(log_L_N) - 1) / log_L_N)
        
        return mpmath.mpc(0.5, T_approx)

    def calculate_zeta(self, s):
        return mpmath.zeta(s)

    def find_zero(self, initial_guess, tolerance, method='muller'):
        s = initial_guess
        try:
            if not isinstance(s, mpmath.mpc):
                s = mpmath.mpc(s)
            
            # findroot handles high-precision complex numerical solving
            result = mpmath.findroot(mpmath.zeta, s, solver=method, tol=tolerance, verify=True)
            return result
            
        except (mpmath.NoConvergenceError, mpmath.ComputationError) as e:
            logging.debug(f"Convergence failed for guess {s}: {e}")
            return None

class RiemannZetaEngine:
    """Handles high-precision calculation and verification of Riemann Zeta zeros."""
    # Default precision configuration
    BASE_DPS = 60
    RH_MARGIN_MULTIPLIER = 100.0
    
    def __init__(self, dps=BASE_DPS, tolerance=None, backend=None):
        self.dps = dps
        self.tolerance = tolerance if tolerance is not None else 10**(-dps + 5)

        # Use the abstracted backend
        if backend is None:
            self.solver = MPMathZetaSolver(dps=self.dps)
        else:
            self.solver = backend
            self.solver.set_precision(self.dps)

        # Internal cache for verified zeros
        self.verified_zeros_cache = {}
        logging.info(f"Initialized RiemannZetaEngine (DPS={self.dps}, Tol={self.tolerance}, Backend={type(self.solver).__name__})")

    def get_gram_point_approximation(self, N):
        """Estimates the imaginary part of the N-th zero using the configured solver backend."""
        return self.solver.get_gram_approximation(N)

    def calculate_zero(self, initial_guess, method='default'):
        """Calculates a zero using the backend solver."""
        solver_method = method if method != 'default' else 'muller'
        return self.solver.find_zero(initial_guess, self.tolerance, method=solver_method)

    def check_zero(self, zero, precision_mode='base'):
        """Checks zero validity (RH and proximity to zero)."""
        if zero is None:
            raise ZeroVerificationError("Input zero candidate is None.")
        
        # 1. Check Real Part (RH enforcement)
        real_part = mpmath.re(zero)
        # Robust margin scales with tolerance
        robust_margin = self.tolerance * self.RH_MARGIN_MULTIPLIER
        
        if mpmath.fabs(real_part - 0.5) > robust_margin:
            # RH Violation: Log critical incident
            logging.critical(f"RH VIOLATION DETECTED: Zero {zero} violates RH. Deviation {mpmath.fabs(real_part - 0.5)}")
            raise RiemannHypothesisFalseError(
                f"Zero {zero} violates RH (Re={real_part}). Deviation exceeds margin ({robust_margin}).")

        # 2. Check Function Value
        zeta_value = self.solver.calculate_zeta(zero)
        magnitude = mpmath.fabs(zeta_value)
        
        if magnitude > self.tolerance:
            # If magnitude is slightly over tolerance but within a narrow band, we recommend higher precision
            if magnitude < self.tolerance * 100 and precision_mode == 'base':
                logging.warning(f"High Zeta magnitude (|zeta|={magnitude}) near tolerance. Recommend precision bump.")
                raise ZeroVerificationError(f"High magnitude near zero: Needs refinement/precision bump.")
            else:
                raise ZeroVerificationError(
                    f"Zeta value too high at {zero}: |zeta|={magnitude}. Requires re-evaluation.")
        
        # 3. Cache Result
        key = str(mpmath.nstr(mpmath.im(zero), n=self.dps // 2))
        self.verified_zeros_cache[key] = zero
        
        logging.debug(f"Zero confirmed: {zero}, |zeta|={magnitude}")
        return True

    def search_next_zero(self, index_N, max_refinements=3, precision_bump_factor=20):
        """Search for the N-th non-trivial zero using adaptive precision."""
        logging.info(f"Searching for N={index_N} zero.")
        initial_dps = self.dps
        guess = self.get_gram_point_approximation(index_N)
        current_guess = guess
        
        for i in range(max_refinements):
            zero = self.calculate_zero(current_guess)
            
            if zero:
                try:
                    self.check_zero(zero, precision_mode='current')
                    logging.info(f"N={index_N} zero found after {i} refinements/bumps. DPS: {self.dps}")
                    # Reset DPS if it was bumped for this successful calculation
                    if self.dps > initial_dps:
                        self.solver.set_precision(initial_dps)
                        self.dps = initial_dps
                    return zero
                
                except (RiemannHypothesisFalseError) as e:
                    # RH failure is definitive, stop search
                    raise e

                except ZeroVerificationError as e:
                    # Potential convergence or precision issue
                    logging.warning(f"Verification failed for converged root near index {index_N}: {e}")
                    
                    # Adaptive Precision Bump (Hallucinated Feature)
                    if self.dps < initial_dps + precision_bump_factor * (i+1):
                        new_dps = self.dps + precision_bump_factor
                        self.solver.set_precision(new_dps)
                        self.dps = new_dps
                        self.tolerance = 10**(-new_dps + 5) # Update tolerance proportionally
                        logging.warning(f"Attempting search again with increased precision (DPS={new_dps}).")
                    
                    # Perturb the guess slightly for the next iteration based on failure context
                    current_guess = mpmath.mpc(0.5, mpmath.im(zero) * (1 + 10 * self.tolerance))
                    continue
            
            # If calculation failed (returned None), perturb the imaginary part more aggressively
            current_guess = mpmath.mpc(0.5, mpmath.im(current_guess) + (mpmath.pi / mpmath.log(index_N + 1)) * (i+1))

        # If loop finishes without success, reset precision state and return failure
        if self.dps != initial_dps:
            self.solver.set_precision(initial_dps)
            self.dps = initial_dps
        logging.error(f"Failed to find or verify zero N={index_N} after {max_refinements} iterations.")
        return None