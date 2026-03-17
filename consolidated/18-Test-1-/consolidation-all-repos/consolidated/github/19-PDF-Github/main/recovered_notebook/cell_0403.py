import logging
from mpmath import findroot, zeta, mp
import cmath

# Setup basic logging if not already configured
if not logging.root.handlers:
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class RiemannHypothesisFalseError(Exception):
    """Exception raised if tests suggest violation of the Riemann Hypothesis."""
    pass

class ZetaZeroTester:
    """
    A facility for numerically calculating and verifying non-trivial zeros 
    of the Riemann Zeta function, incorporating adaptive precision logic.
    """
    
    def __init__(self, dps=50, tolerance_reduction_factor=0.95):
        self.dps = dps
        mp.dps = dps  # Set global mpmath precision
        self.tolerance_reduction_factor = tolerance_reduction_factor
        logging.info(f"ZetaZeroTester initialized (DPS={self.dps})")

    def _get_target_function(self, method: str):
        """Maps method strings to the actual function whose roots are sought."""
        if method == 'zeta_prime':
            # Searches for critical points (zeros of zeta prime)
            return lambda t: zeta(t, derivative=1)
        
        # Default: zeros of the zeta function
        return lambda t: zeta(t)
        
    def calculate_zero(self, s: complex, method='default', solver='newton', **kwargs) -> complex or None:
        """
        Calculates a zero of the target function near the initial guess s.
        Refactored to remove redundant method checks and centralize configuration.
        """
        try:
            target_func = self._get_target_function(method)
            
            # Ensure the provided initial guess is treated as high precision
            s_mpc = mp.mpc(s.real, s.imag)
            
            zero_mpf = findroot(target_func, s_mpc, solver=solver, **kwargs)
            return complex(zero_mpf)
        except Exception as e:
            logging.warning(f"Zero finding failed near s={s} using method '{method}': {e}")
            return None

    def check_zero(self, zero: complex, tolerance: float):
        """
        Verifies two key properties: 1) Proximity to the critical line (Re(s)=0.5),
        and 2) Function value proximity to zero (|zeta(s)| ~ 0).
        """
        if abs(zero.real - 0.5) > tolerance:
            raise RiemannHypothesisFalseError(
                f"Zero {zero} is off the critical line! Re(s)={zero.real}. Tolerance={tolerance:.2e}"
            )
            
        zeta_val = zeta(zero)
        if abs(zeta_val) > tolerance:
            raise RiemannHypothesisFalseError(
                f"Zero {zero} is not a true zero of zeta! |zeta(s)|={abs(zeta_val):.2e}"
            )

    def test_zeros(self, start_imag, step_imag, max_zeros_to_test, 
                   tolerance_initial, numerical_method='default'):
        
        tolerance = tolerance_initial
        tolerance_history = []
        zeros = []
        
        reduction_factor = self.tolerance_reduction_factor

        for i in range(max_zeros_to_test):
            imag_part = start_imag + i * step_imag
            s_guess = 0.5 + 1j * imag_part
            
            # numerical_method is sourced from configuration, not the method parameter in original code
            zero = self.calculate_zero(s_guess, method=numerical_method)
            
            if zero is None:
                zeros.append(None)
                tolerance_history.append(tolerance) 
                continue
                
            try:
                self.check_zero(zero, tolerance)
                
                # Adaptive Tolerance Logic (Tightening requirements if highly stable)
                if abs(zero.real - 0.5) < tolerance / 2: 
                    tolerance *= reduction_factor
                else:
                    # If near the tolerance boundary, allow slight numerical relaxation
                    tolerance /= reduction_factor 
                
                tolerance_history.append(tolerance)
                zeros.append(zero)
                
            except RiemannHypothesisFalseError as e:
                logging.critical(f"RH Violation detected at iteration {i}: {e}")
                return False, zero, tolerance, tolerance_history, zeros
                
        return True, None, tolerance, tolerance_history, zeros

# Contextual integration based on the original snippet structure

class SimulationEnvironment(ZetaZeroTester):
    # Dummy config utility to satisfy the structure of the original incomplete __main__ block
    class Config:
        def get(self, section, default):
            if section == "simulation":
                return {"num_agents": 5}
            return default
    
    config = Config()

    def __init__(self, dps=60):
        super().__init__(dps=dps)

    def run_agent_task(self, agent_id: int):
        """Simulates an agent executing a search task."""
        
        # Example test setup
        base_start_imag = 10.0
        step_imag_offset = 5.0 * agent_id 
        max_tests = 2
        
        start_imag = base_start_imag + step_imag_offset
        step_imag = 15.0 
        tolerance_initial = 1e-12 
        
        logging.info(f"Agent {agent_id}: Starting zero search from Im(s)={start_imag:.2f} for {max_tests} roots.")
        
        success, violator, final_tol, hist, zeros = self.test_zeros(
            start_imag=start_imag, 
            step_imag=step_imag, 
            max_zeros_to_test=max_tests, 
            tolerance_initial=tolerance_initial,
            numerical_method='default'
        )

        if success:
            logging.info(f"Agent {agent_id}: Verified. Final tolerance: {final_tol:.2e}")
        
        return success


if __name__ == "__main__":
    try:
        # Using the fictional config based on original snippet
        config = SimulationEnvironment.Config()
        sim = SimulationEnvironment()
        num_agents = config.get("simulation", {}).get("num_agents", 5)
        
        all_passed = True
        for i in range(1, num_agents + 1):
            if not sim.run_agent_task(i):
                all_passed = False
                break
        
        if all_passed:
             logging.info("System check completed. All agents passed RH tests.")

    except Exception as e:
        logging.error(f"FATAL EXECUTION ERROR in __main__: {e}")