from typing import Dict, List, Tuple
import numpy as np
from statsmodels.tsa.api import ExponentialSmoothing, SimpleExpSmoothing

class MetricAnalyzer:
    """
    Utility class responsible for advanced statistical analysis and forecasting of historical metrics (S-01, S-02).
    Calculates trends, volatility, uncertainty, and proposes optimal GTCM threshold adjustments based on predictions.
    """

    def __init__(self, smoothing_window: int = 10, confidence_level: float = 0.95):
        # smoothing_window controls the alpha (2/(N+1)). Must be positive.
        self.smoothing_window = max(5, smoothing_window) 
        self.confidence_level = confidence_level
        # Require slightly more than just the window for stable variance estimation
        self.min_data_points = self.smoothing_window + 5 

    def _fit_and_forecast_metric(self, data: List[float], steps: int = 1) -> Tuple[float, float, float]:
        """
        Fits data using Exponential Smoothing and forecasts the metric value and its confidence interval.
        Returns: (Forecasted Value, Lower Bound CI, Upper Bound CI)
        """
        if len(data) < self.min_data_points:
            # Use a specialized, less severe error for internal handling
            raise IndexError(
                f"Insufficient data ({len(data)} points) for robust forecasting. Need at least {self.min_data_points}."
            )

        # Calculate alpha based on smoothing window (standard approximation 2/(N+1))
        alpha = 2 / (self.smoothing_window + 1)
        
        # Using Simple Exponential Smoothing (SES) as we are not explicitly modeling Trend or Seasonality 
        # for a single metric time series analysis, making the results easier to interpret and less prone to overfitting.
        model = SimpleExpSmoothing(data, initialization_method="estimated").fit(
            smoothing_level=alpha,
            optimized=False, # Use calculated alpha instead of optimization
            remove_bias=True
        )
        
        # Forecast 1 step ahead (next cycle)
        forecast_results = model.get_forecast(steps=steps)
        
        mean_forecast = forecast_results.predicted_mean.iloc[steps - 1]
        
        # Calculate confidence interval
        alpha_ci = 1 - self.confidence_level
        
        # Fetch confidence bounds
        ci_frame = forecast_results.conf_int(alpha=alpha_ci)
        lower_bound = ci_frame['lower'].iloc[steps - 1]
        upper_bound = ci_frame['upper'].iloc[steps - 1]
        
        return mean_forecast, lower_bound, upper_bound

    def analyze_gtcm_performance(self, history: Dict[str, list]) -> Dict[str, float]:
        """
        Analyzes S-01 (Efficiency) and S-02 (Exposure) history using predictive analytics 
        to suggest forward-looking threshold adjustments.
        
        Suggested Logic:
        - S-01 Floor: Use the Lower Confidence Interval (LCI) to maintain high expected utility.
        - S-02 Ceiling: Use the Upper Confidence Interval (UCI) to capture maximum expected risk.
        """
        suggestions = {}
        
        for metric, data in history.items():
            if metric not in ['S-01', 'S-02']:
                continue
                
            try:
                pred, lower_ci, upper_ci = self._fit_and_forecast_metric(data)
                
                if metric == 'S-01':
                    # Suggest utility floor (Minimum acceptable efficiency)
                    suggestions['suggested_s01_floor'] = round(lower_ci, 4)
                
                elif metric == 'S-02':
                    # Suggest risk ceiling (Maximum acceptable exposure)
                    suggestions['suggested_s02_ceiling'] = round(upper_ci, 4)

            except IndexError: # Handled by _fit_and_forecast_metric
                # Skip calculation if insufficient data
                continue

        return suggestions
