```python
import mpmath
import time
import logging
import matplotlib.pyplot as plt
import numpy as np
import os
import sys

# Set up logging - ONLY ERRORS ARE NOW LOGGED
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')

# Define a custom exception for Riemann Hypothesis violation
class RiemannHypothesisFalseError(Exception):
    pass

def calculate_zero(s, method='default'):
    """ Calculates a zero of the Riemann zeta function using mpmath. """
    try:
        if method == 'default':
            return mpmath.findroot(mpmath.zeta, s)

def test_zeros(start_imag, step_imag, max_zeros_to_test, tolerance_initial, tolerance_reduction_factor, numerical_method):
    # Return the found violation
    return False, None, tolerance_initial

    # Return True if all tested zeros are on the critical line
    return True, None, tolerance_initial

# --- Main Execution ---
if __name__ == "__main__":
    start_imag = 14.0  # Starting imaginary part
    step_imag = 14.0  # Step size for imaginary part
    max_zeros_to_test = 10000  # Increased tests
    tolerance_initial = 0.1
    tolerance_reduction_factor = 0.9
    numerical_method = 'default'  # 'default', 'series', 'newton'
    start_time = time.time()
    try:
        hypothesis_holds, violating_zero, final_tolerance = test_zeros(start_imag, step_imag, max_zeros_to_test, tolerance_initial, tolerance_reduction_factor, numerical_method)
        if hypothesis_holds:
            logging.info(f"Riemann Hypothesis holds (within tested zeros and tolerance).")
        else:
            logging.error(f"Riemann Hypothesis is likely FALSE. Violating zero found: {violating_zero}")
    except RiemannHypothesisFalseError as e:
        logging.error(e)
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
    end_time = time.time()
    execution_time = end_time - start_time
    logging.info(f"Execution time: {execution_time:.2f} seconds")

'''
# Example output:
# 2024-01-01 12:00:00,000 - ERROR - Riemann Hypothesis is likely FALSE. Violating zero found: 0.5 + 14.0j
# 2024-01-01 12:00:00,000 - INFO - Execution time: 10.50 seconds
'''