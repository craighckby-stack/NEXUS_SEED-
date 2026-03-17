import numpy as np
from typing import Tuple, Optional, Union

# Standard scaling factor for consistency with Gaussian standard deviation 
# Defined as 1 / (Phi^-1(0.75)). 1.4826 ≈ 1/0.6745
_DEFAULT_MAD_SCALE = 1.4826

# --- Internal Utility Functions ---

def _validate_inputs(
    values: np.ndarray, 
    weights: np.ndarray
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Helper to validate inputs (values and weights) and calculate normalized weights.
    
    Ensures input data uses float64 for precision.
    """
    
    # Use standard float precision (e.g., float64) internally
    values = np.ravel(values).astype(np.float64)
    weights = np.ravel(weights).astype(np.float64)
    
    if values.size == 0:
        raise ValueError("Input data cannot be empty.")
    if values.shape != weights.shape:
        raise ValueError(f"Values shape {values.shape} must match weights shape {weights.shape}.")
    
    if np.any(weights < 0):
        raise ValueError("Weights must be non-negative.")
        
    total_weight = np.sum(weights)
    
    # Check if total weight is effectively zero
    if total_weight <= np.finfo(np.float64).eps * values.size:
        raise ValueError("Total weight is effectively zero.")

    # Normalize weights
    normalized_weights = weights / total_weight
    
    return values, normalized_weights


def _weighted_quantile_impl(
    values: np.ndarray, 
    normalized_weights: np.ndarray, 
    quantile: float
) -> float:
    """Core implementation for calculating the weighted quantile."""
    
    if not 0.0 <= quantile <= 1.0:
        raise ValueError("Quantile must be between 0 and 1 inclusive.")

    # 1. Sort based on values
    sorted_indices = np.argsort(values)
    sorted_values = values[sorted_indices]
    sorted_weights = normalized_weights[sorted_indices]
    
    # 2. Calculate cumulative weights
    cumulative_weights = np.cumsum(sorted_weights)
    
    # 3. Find the index where cumulative weight crosses the quantile threshold
    quantile_index = np.searchsorted(cumulative_weights, quantile, side='left')

    # Handle the edge case for quantile=1.0 when index goes out of bounds
    if quantile_index >= len(sorted_values):
        return sorted_values[-1]

    return sorted_values[quantile_index]


# --- Public Robust Statistical Measures ---

def calculate_weighted_quantile(
    values: Union[np.ndarray, list], 
    weights: Union[np.ndarray, list], 
    quantile: float
) -> float:
    """
    Calculates the weighted quantile (e.g., Q1, Median (Q2), Q3) of the data.
    
    Args:
        values: The data points (1D).
        weights: The corresponding weights (non-negative, 1D).
        quantile (float): The target quantile (0.0 <= q <= 1.0).

    Returns:
        float: The weighted quantile value.
    """
    values_arr, weights_arr = np.asarray(values), np.asarray(weights)
    values, normalized_weights = _validate_inputs(values_arr, weights_arr)
    return _weighted_quantile_impl(values, normalized_weights, quantile)


def calculate_weighted_median(
    values: Union[np.ndarray, list], 
    weights: Union[np.ndarray, list]
) -> float:
    """
    Calculates the weighted median (0.5 quantile).
    """
    return calculate_weighted_quantile(values, weights, 0.5)


def calculate_wmad(
    values: Union[np.ndarray, list], 
    weights: Union[np.ndarray, list], 
    scaling_factor: float = _DEFAULT_MAD_SCALE
) -> Tuple[float, float]:
    """
    Calculates the Weighted Median (W_Median) and the Weighted Median Absolute Deviation (WMAD).
    
    WMAD = scaling_factor * W_Median(|values - W_Median(values)|).

    Args:
        values: The data points.
        weights: The corresponding weights (non-negative).
        scaling_factor (float, optional): Factor (1.4826 for Gaussian consistency).

    Returns:
        Tuple[float, float]: (weighted_median, wmad)
    """
    
    # Input normalization/validation happens inside median calculation
    weighted_median = calculate_weighted_median(values, weights)
    
    # Ensure values is an array for efficient deviation calculation
    values_arr = np.asarray(values, dtype=np.float64)

    deviations = np.abs(values_arr - weighted_median)
    
    # The weights remain the same for the deviation calculation
    wmad_raw = calculate_weighted_median(deviations, weights)

    robust_spread = scaling_factor * wmad_raw
    
    return weighted_median, robust_spread
    

def calculate_median_mad(
    values: Union[np.ndarray, list],
    scaling_factor: float = _DEFAULT_MAD_SCALE
) -> Tuple[float, float]:
    """
    Calculates the standard Median and Median Absolute Deviation (MAD) 
    by treating the inputs as uniformly weighted.

    Args:
        values: The data points.
        scaling_factor (float, optional): Factor (1.4826 for Gaussian consistency).

    Returns:
        Tuple[float, float]: (median, mad)
    """
    values_arr = np.asarray(values)
    if values_arr.size == 0:
        raise ValueError("Input data cannot be empty.")

    # Create uniform weights efficiently
    uniform_weights = np.ones_like(values_arr, dtype=np.float64)
    
    return calculate_wmad(values_arr, uniform_weights, scaling_factor)