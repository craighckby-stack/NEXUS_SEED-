import numpy as np
from typing import Optional, Union, Tuple
from .robust_stats import calculate_wmad, _DEFAULT_MAD_SCALE

class RobustScaler:
    """
    A robust standardization utility based on Weighted Median and WMAD.
    
    Scales data X according to: (X - center) / scale
    
    where center = Weighted Median and scale = WMAD.
    
    Handles multi-feature arrays (n_samples, n_features) column-wise.
    """
    
    def __init__(self, scaling_factor: float = _DEFAULT_MAD_SCALE, zero_epsilon: float = 1e-6):
        """
        Initializes the RobustScaler.
        
        Args:
            scaling_factor (float): The scaling factor used for WMAD calculation.
            zero_epsilon (float): Small value to add to the scale to prevent division by zero.
        """
        self.scaling_factor = scaling_factor
        self.zero_epsilon = zero_epsilon
        self.center_: Optional[np.ndarray] = None
        self.scale_: Optional[np.ndarray] = None

    def fit(self, X: np.ndarray, weights: Optional[np.ndarray] = None) -> 'RobustScaler':
        """
        Computes the weighted median (center) and WMAD (scale) for the input data.
        
        Args:
            X (np.ndarray): Data array, expected shape (n_samples, n_features) or (n_samples,).
            weights (Optional[np.ndarray]): Sample weights. If None, assumes uniform weights.
            
        Returns:
            RobustScaler: self
        """
        X = np.asarray(X)
        if X.ndim == 1:
            X = X[:, np.newaxis]

        n_features = X.shape[1]
        
        self.center_ = np.zeros(n_features, dtype=float)
        self.scale_ = np.zeros(n_features, dtype=float)

        if weights is None:
            weights = np.ones(X.shape[0])
            
        for i in range(n_features):
            # Ensure the slice is passed correctly if data validation expects 1D arrays
            center, scale = calculate_wmad(X[:, i], weights, self.scaling_factor)
            self.center_[i] = center
            self.scale_[i] = scale
            
        # Add epsilon for numerical stability when scale is near zero
        self.scale_[self.scale_ < self.zero_epsilon] = self.zero_epsilon
            
        return self

    def transform(self, X: np.ndarray) -> np.ndarray:
        """
        Scales the data using the learned center and scale.
        
        Args:
            X (np.ndarray): Data array to transform.
            
        Returns:
            np.ndarray: The robustly scaled data.
        
        Raises:
            RuntimeError: If fit has not been called.
        """
        if self.center_ is None or self.scale_ is None:
            raise RuntimeError("Scaler must be fitted before transforming data.")
            
        X = np.asarray(X)
        if X.ndim == 1:
            # Retain the original 1D shape behavior if possible, but calculations require 2D context
            X_in = X[:, np.newaxis]
        else:
            X_in = X
            
        if X_in.shape[1] != len(self.center_):
             raise ValueError(f"Expected {len(self.center_)} features, but got {X_in.shape[1]}.")

        # Apply scaling
        X_scaled = (X_in - self.center_) / self.scale_
        
        return X_scaled.squeeze() if X.ndim == 1 else X_scaled

    def fit_transform(self, X: np.ndarray, weights: Optional[np.ndarray] = None) -> np.ndarray:
        """Fit data, then transform it."""
        return self.fit(X, weights).transform(X)