```python
def calculate_zero(self, s, method='numerical', numerical_method='newton'):
    try:
        if method == 'numerical':
            zero = findroot(lambda t: zeta(t), s, solver=numerical_method)
        return complex(zero)
    except Exception as e:
        logging.warning(f"Zero finding failed: {e}")
        return None

def check_zero(self, zero, tolerance):
    from mpmath import zeta, mp
    mp.dps = 50
    if abs(zero.real - 0.5) > tolerance:
        raise RiemannHypothesisFalseError(f"Zero {zero} is off the critical line!")
    if abs(zeta(zero)) > tolerance:
        raise RiemannHypothesisFalseError(f"Zero {zero} is not a zero of zeta!")

def test_zeros(self, start_imag, step_imag, max_zeros_to_test, tolerance_initial, tolerance_reduction_factor):
    tolerance = tolerance_initial
    tolerance_history = []
    zeros = []
    for i in range(max_zeros_to_test):
        imag_part = start_imag + i * step_imag
        s = 0.5 + 1j * imag_part
        zero = self.calculate_zero(s, method='numerical', numerical_method='newton')
        if zero is None:
            zeros.append(None)
            continue
        try:
            self.check_zero(zero, tolerance)
            if abs(zero.real - 0.5) <= tolerance:
                tolerance *= tolerance_reduction_factor
            else:
                tolerance /= tolerance_reduction_factor
            tolerance_history.append(tolerance)
            zeros.append(zero)
        except RiemannHypothesisFalseError as e:
            logging.error(e)
            return False, zero, tolerance, tolerance_history, zeros
    return True, None, tolerance, tolerance_history, zeros

class RiemannHypothesisFalseError(Exception):
    pass

if __name__ == "__main__":
    try:
        sim = SimulationEnvironment()
        num_agents = config.get("simulation", {}).get("num_agents", 5)
        for i in range(1, num_agents + 1):
            sim.create_agent(f"Agent_{i}")
        cycles = config.get("simulation", {}).get("cycles", 1000)
        log_interval = config.get("simulation", {}).get("log_interval", 10)
        agent_5_id = "Agent_5"
        agent_5_action_count = 0
        riemann_config = config.get("riemann_hypothesis", {})
        start_imag = riemann_config.get("start_imag", 14.134725)
        step_imag = riemann_config.get("step_imag", 0.1)
        max_zeros_to_test = riemann_config.get("max_zeros_to_test", 10)

# 
# Output/logs can be placed here
# 
```