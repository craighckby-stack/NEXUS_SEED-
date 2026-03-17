import numpy as np
from typing import Tuple

# Standard scaling factor for consistency with Gaussian standard deviation 
_DEFAULT_MAD_SCALE = 1.4826

def calculate_weighted_median(values: np.ndarray, weights: np.ndarray) -> float:
    """
    Calculates the weighted median of a 1D NumPy array.

    Args:
        values (np.ndarray): The data points. Must be 1D.
        weights (np.ndarray): The corresponding weights (non-negative). Must match the shape of values.

    Returns:
        float: The weighted median.
    """
    values = np.ravel(values)
    weights = np.ravel(weights)

    if values.size == 0:
        raise ValueError("Input data cannot be empty.")
    if values.shape != weights.shape:
        raise ValueError("Values and weights must have the same shape.")
    if np.any(weights < 0):
        raise ValueError("Weights must be non-negative.")
        
    total_weight = np.sum(weights)
    if total_weight == 0:
        raise ValueError("Total weight cannot be zero.")

    # Normalize weights
    normalized_weights = weights / total_weight

    # Sort based on values
    sorted_indices = np.argsort(values)
    sorted_values = values[sorted_indices]
    sorted_weights = normalized_weights[sorted_indices]
    
    # Calculate cumulative weights
    cumulative_weights = np.cumsum(sorted_weights)
    
    # Find the index where cumulative weight crosses 0.5 using binary search
    median_index = np.searchsorted(cumulative_weights, 0.5, side='left')
    
    # Return the value at that index
    return sorted_values[median_index]

def calculate_wmad(
    values: np.ndarray, 
    weights: np.ndarray, 
    scaling_factor: float = _DEFAULT_MAD_SCALE
) -> Tuple[float, float]:
    """
    Calculates the Weighted Median (W_Median) and the Weighted Median Absolute Deviation (WMAD).
    
    The WMAD is calculated as: scaling_factor * W_Median(|values - W_Median(values)|).

    Args:
        values (np.ndarray): The data points.
        weights (np.ndarray): The corresponding weights (non-negative).
        scaling_factor (float, optional): Factor to make WMAD consistent with standard deviation 
                                         for normally distributed data (default 1.4826).

    Returns:
        Tuple[float, float]: (weighted_median, wmad)
    """
    # 1. Calculate the center (Weighted Median)
    weighted_median = calculate_weighted_median(values, weights)
    
    # 2. Calculate the weighted median of the absolute deviations
    deviations = np.abs(values - weighted_median)
    
    # The weights remain the same for the deviation calculation
    wmad_raw = calculate_weighted_median(deviations, weights)

    robust_spread = scaling_factor * wmad_raw
    
    return weighted_median, robust_spread
