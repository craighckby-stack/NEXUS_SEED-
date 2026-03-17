import numpy as np
from typing import Tuple, Optional

# Assuming robust_stats.py is in the same directory and contains calculate_wmad
from .robust_stats import calculate_wmad

def robust_z_score(
    values: np.ndarray,
    weights: np.ndarray,
    median: Optional[float] = None,
    wmad: Optional[float] = None
) -> np.ndarray:
    """
    Calculates the Robust Z-score (modified Z-score using WMAD).
    
    Robust Z = 0.6745 * |Xi - W_Median| / WMAD.

    Args:
        values (np.ndarray): The data points.
        weights (np.ndarray): The corresponding weights.
        median (Optional[float]): Pre-calculated weighted median.
        wmad (Optional[float]): Pre-calculated WMAD (scaled).

    Returns:
        np.ndarray: Array of robust Z-scores.
    """
    if median is None or wmad is None:
        # Ensure we don't recalculate if already provided
        median, wmad = calculate_wmad(values, weights)

    if np.isclose(wmad, 0.0):
        # Handle case where all values are clustered, preventing division by zero
        return np.where(np.isclose(values, median), 0.0, np.finfo(float).max)

    # The factor 0.6745 is 1/1.4826 (reciprocal of the MAD scaling factor)
    robust_z = 0.6745 * np.abs(values - median) / wmad
    return robust_z

def mad_outlier_filter(
    values: np.ndarray,
    weights: np.ndarray,
    threshold: float = 3.5
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Filters data points based on the Robust Z-score (using WMAD).
    
    Args:
        values: Data points.
        weights: Weights for data points.
        threshold: Z-score threshold for outlier classification (default 3.5).
        
    Returns:
        Tuple[np.ndarray, np.ndarray]: (inliers, outliers)
    """
    z_scores = robust_z_score(values, weights)
    
    is_outlier = z_scores > threshold
    
    inliers = values[~is_outlier]
    outliers = values[is_outlier]
    
    return inliers, outliers
