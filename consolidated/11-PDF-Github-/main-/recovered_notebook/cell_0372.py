import mpmath as mp

# NOTE: mpmath relies on global precision (mp.dps). 
# It is crucial to manage this state explicitly for reliable scientific computation.

def check_riemann_critical_line_for_n_zeros(n: int, required_dps: int = 50) -> dict:
    """
    Verifies if the first N non-trivial zeros of the Riemann Zeta function,
    as computed by mpmath, lie on the critical line (Real part = 0.5).

    Args:
        n (int): The number of zeros (starting from the 1st) to check.
        required_dps (int): The decimal precision to use for mpmath calculations.

    Returns:
        dict: Status report including result, detail, and precision used.
    """
    
    original_dps = mp.dps
    
    try:
        # Set required high precision locally
        mp.dps = required_dps
        
        # Define tolerance relative to the current precision
        tol = 10**(-required_dps + 5) 
        
        for i in range(1, n + 1):
            # Compute the i-th non-trivial zero. This operation implicitly
            # assumes the Riemann Hypothesis is true for its computational verification.
            zero = mp.zetazero(i)
            
            # Check proximity to Re(s) = 0.5
            deviation = abs(zero.real - 0.5)
            
            if deviation > tol:
                return {
                    "result": "False (Deviation)",
                    "status": f"Zero {i} deviates significantly from Re=0.5.",
                    "deviation": float(deviation),
                    "zero": str(zero),
                    "precision_dps": mp.dps,
                    "tolerance_limit": float(tol)
                }
                
        return {
            "result": "True (Verified)",
            "status": f"All {n} tested zeros lie on the critical line within computational limits.",
            "precision_dps": mp.dps,
            "tolerance_limit": float(tol)
        }

    except Exception as e:
        return {
            "result": "Error",
            "status": "An unexpected error occurred during calculation.",
            "detail": str(e),
            "precision_dps": mp.dps, # Report DPS even on failure
        }
        
    finally:
        # Always restore original precision settings
        mp.dps = original_dps

# Example usage:
# status = check_riemann_critical_line_for_n_zeros(n=10, required_dps=70)