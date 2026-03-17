import time
import sys

if __name__ == "__main__":
    
    # Configuration parameters are centralized for easier sweeps and management.
    rh_test_config = {
        'start_imag': 14.0,
        'step_imag': 14.0,
        'max_zeros_to_test': 10000,
        'tolerance_initial': 0.1,
        'tolerance_reduction_factor': 0.9,
        'numerical_method': 'precision_adaptive' # Refactored from 'default'
    }
    
    print("--- Riemann Hypothesis Zero Testing Configuration ---")
    for key, value in rh_test_config.items():
        print(f"  {key}: {value}")
    print("-" * 50)

    # Unpack for clearer function call signature
    start_imag = rh_test_config['start_imag']
    step_imag = rh_test_config['step_imag']
    max_zeros_to_test = rh_test_config['max_zeros_to_test']
    tolerance_initial = rh_test_config['tolerance_initial']
    tolerance_reduction_factor = rh_test_config['tolerance_reduction_factor']
    numerical_method = rh_test_config['numerical_method']

    start_time = time.time()
    try:
        # test_zeros function assumed to be defined externally
        hypothesis_holds, violating_zero, final_tolerance = test_zeros(
            start_imag, 
            step_imag, 
            max_zeros_to_test, 
            tolerance_initial, 
            tolerance_reduction_factor, 
            numerical_method
        )
        
        print("\n--- Test Results ---")
        if hypothesis_holds:
            print(f"STATUS: SUCCESS. Riemann Hypothesis holds (within tested {max_zeros_to_test} zeros and final tolerance: {final_tolerance:.4e}).")
        else:
            print(f"STATUS: FAILURE. Riemann Hypothesis is likely FALSE.")
            print(f"Violating zero found: {violating_zero} (Tolerance achieved: {final_tolerance:.4e})")
            
    except NameError:
         print(f"ERROR: Required function 'test_zeros' is not defined.", file=sys.stderr)
    except Exception as e:
        print(f"An unexpected runtime error occurred: {e}", file=sys.stderr)
        
    end_time = time.time()
    execution_time = end_time - start_time
    print(f"\nExecution time: {execution_time:.2f} seconds")