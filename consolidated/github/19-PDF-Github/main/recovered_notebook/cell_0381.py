```python
except Exception as e: 
    # Catch all exceptions during findroot
    logging.error(f"Error calculating zero: {e}")
    return None

def check_zero(zero, tolerance):
    """ Checks if a zero is on the critical line within a given tolerance.
    Raises a RiemannHypothesisFalseError if the zero is off the line. """
    if abs(zero.real - 0.5) > tolerance:
        raise RiemannHypothesisFalseError(f"Zero found off the critical line: {zero} (real")

def test_zeros(start_imag, step_imag, max_zeros_to_test, tolerance_initial, tolerance_reduct):
    """ Tests zeros of the Riemann zeta function and attempts to falsify the Riemann Hypothesis """
    tolerance = tolerance_initial
    for i in range(max_zeros_to_test):
        imag_part = start_imag + i * step_imag
        s = 0.5 + 1j * imag_part  # Start on the critical line
        zero = calculate_zero(s, method=numerical_method)
        if zero is None:
            # No zero found, continue to next iteration. This is not a falsification
            continue
        try:
            check_zero(zero, tolerance)
            # If we reach here, the zero is on the critical line. We do nothing.
            # Dynamic tolerance adjustment
            if abs(zero.real - 0.5) <= tolerance:
                tolerance *= tolerance_reduction_factor  # Reduce tolerance if successful
            else:
                tolerance /= tolerance_reduction_factor  # Increase tolerance if not successful
        except RiemannHypothesisFalseError as e:
            logging.error(e)  # Log the error
            return False, zero, tolerance  # Return the found violation
    return True, None, tolerance  # Return True if all tested zeros are on the critical line

# --- Main Execution ---
if __name__ == "__main__":
    start_imag = 14.0  # Starting imaginary part
    step_imag = 14.0  # Step size for imaginary part
    max_zeros_to_test = 10000  # Increased tests - adjust as needed for Colab resources
    tolerance_initial = 0.1
    tolerance_reduction_factor = 0.9
    numerical_method = 'default'  # 'default'

'''
# Example output/logs:
# Error calculating zero: ...
# Zero found off the critical line: ... (real)
# Riemann Hypothesis False: ...
'''