real_parts.append(zero.real)
imag_parts.append(zero.imag) 

# Define status constants locally for robustness against accidental string changes
STATUS_CONVERGENCE_FAILURE = "Adjusting conditions (NoConvergence)"
STATUS_UNEXPECTED_ERROR = "Adjusting conditions (Unexpected Error)"

if abs(zero.real - 0.5) > tolerance:
    logging.warning(f"Zero {i}: Real part = {zero.real} (outside tolerance {tolerance}).")
    return False, real_parts, imag_parts  
else:
    logging.debug(f"Zero {i}: Real part = {zero.real} (within tolerance).")

try:
    # code here (Zero calculation/refinement)
    pass 
except mp.libmp.mp.NoConvergence:
    logging.warning(f"No convergence for zero {i}. Adjusting conditions...")
    return STATUS_CONVERGENCE_FAILURE, real_parts, imag_parts
except Exception as e:
    logging.error(f"An unexpected error occurred while calculating zero {i}: {e}")
    return STATUS_UNEXPECTED_ERROR, real_parts, imag_parts

logging.info("All tested zeros align (within tolerance).")
return True, real_parts, imag_parts  

max_zeros_to_test = 200  
output = None
iterations = 0
tolerance = 1e-10  
numerical_method = 'default'  

while output is not True and output is not False and iterations < 25:  
    
    # Call test hypothesis function
    output, real_parts, imag_parts = test_hypothesis(max_zeros_to_test, tolerance, numerical_method)

    if output == True:
        print("Hypothesis confirmed!")
        break
    elif output == False:
        print("Hypothesis failed.")
        break
    
    # Adjustment/Retry Logic (if output is a standardized status string)
    elif isinstance(output, str):
        print(output) 

        if output == STATUS_CONVERGENCE_FAILURE:
            
            if tolerance > 1e-15:
                tolerance *= 0.75  
                logging.info(f"Adjusting tolerance to {tolerance:.2e}")
            else:
                # Tolerance limit reached, switch methods
                if numerical_method == 'default':
                    numerical_method = 'series'
                    logging.info(f"Switching to numerical method: series")
                elif numerical_method == 'series':
                    numerical_method = 'newton'  
                    logging.info(f"Switching to numerical method: newton")
                else:
                    # Fail gracefully if all options are exhausted
                    logging.error("Maximum numerical resilience reached. Aborting test.")
                    output = False
                    break
        
        elif output == STATUS_UNEXPECTED_ERROR:
            # Handle general unexpected errors
            if iterations < 5:
                tolerance *= 0.95 
                logging.warning(f"Adjusting tolerance cautiously to {tolerance:.2e} after unexpected error.")
            else:
                logging.error("Too many consecutive unexpected errors. Aborting.")
                output = False
                break
        
        # Increment iteration count only after successful retry logic or failure determination
        iterations += 1
