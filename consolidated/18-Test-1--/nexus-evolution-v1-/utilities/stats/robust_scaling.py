import numpy as np
from typing import Union, Optional, Tuple
from .robust_stats import calculate_median_mad, calculate_wmad, _DEFAULT_MAD_SCALE

def robust_zscore(
    data: np.ndarray, 
    median: float, 
    mad: float, 
    scaling_factor: float = _DEFAULT_MAD_SCALE
) -> np.ndarray:
    """
    Calculates a robust Z-score (or Modified Z-score) using the Median 
    and the scaled Median Absolute Deviation (MAD).
    
    Robust Z = (x - Median) / MAD_raw, where MAD_raw = MAD / scaling_factor.

    Args:
        data (np.ndarray): Input data array.
        median (float): Pre-calculated location.
        mad (float): Pre-calculated scaled MAD (Robust spread).
        scaling_factor (float): The factor used to scale the MAD.

    Returns:
        np.ndarray: Array of robust Z-scores.
    """
    # 1. Calculate unscaled MAD (MAD_raw) for denominator
    mad_raw = mad / scaling_factor

    if mad_raw == 0:
        # Handle zero spread: values equal to median get 0, others get infinity.
        return np.where(data == median, 0.0, np.inf)

    robust_zscore_factor = 1.0 / mad_raw
    return (data - median) * robust_zscore_factor

def scale_data_robustly(
    data: Union[np.ndarray, list], 
    weights: Optional[Union[np.ndarray, list]] = None,
    scaling_factor: float = _DEFAULT_MAD_SCALE
) -> Tuple[np.ndarray, float, float]:
    """
    Calculates robust location and scale parameters (Median/MAD) and then 
    applies robust Z-scoring to the data.
    
    Returns: (scaled_data, location, scale)
    """
    data_arr = np.asarray(data, dtype=np.float64)

    if data_arr.size == 0:
        return np.array([]), 0.0, 0.0

    if weights is not None:
        median, mad = calculate_wmad(data_arr, np.asarray(weights), scaling_factor)
    else:
        median, mad = calculate_median_mad(data_arr, scaling_factor)
        
    scaled_data = robust_zscore(data_arr, median, mad, scaling_factor)
    
    return scaled_data, median, mad
