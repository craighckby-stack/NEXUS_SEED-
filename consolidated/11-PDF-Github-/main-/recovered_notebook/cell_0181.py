import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler

class StockAnalyzer:
    """
    Encapsulates the stock prediction pipeline using Linear Regression.
    Refactored to allow configurable lag features for basic time-series modeling.
    Architecturally updated to include Standard Scaling for feature robustness
    and compatibility with future advanced models (e.g., neural networks).
    """
    def __init__(self, ticker, sentiment_strength=0.03, random_state=4, lag_periods=3, model=LinearRegression()):
        self.ticker = ticker
        self.sentiment_strength = sentiment_strength
        self.random_state = random_state
        self.lag_periods = lag_periods
        self.model = model  # Allows injection of different models
        
        self._history = None # Stores the required tail data for recursive prediction
        self.feature_columns = ['Days']
        
        # Architectural additions for scaling
        self.scaler = None

    def _fit_scaler(self, X: pd.DataFrame):
        """Fits the scaler on the training features."""
        self.scaler = StandardScaler()
        self.scaler.fit(X)

    def _transform_data(self, X: pd.DataFrame, fit: bool = False):
        """Transforms data using the fitted scaler. If fit=True, fits the scaler first."""
        if fit:
            self._fit_scaler(X)
        
        if self.scaler is not None:
            # Scaling returns a numpy array; reconstitute as DataFrame to maintain feature names
            X_transformed = pd.DataFrame(
                self.scaler.transform(X),
                columns=X.columns,
                index=X.index if X.index is not None else range(len(X))
            )
            return X_transformed
        return X # Return original if no scaler is fitted

    def _create_lagged_features(self, data: pd.DataFrame):
        """Generates lagged features for the 'Close' price and prepares the input data."""
        data_processed = data.copy()
        self.feature_columns = ['Days']

        if self.lag_periods > 0:
            for i in range(1, self.lag_periods + 1):
                lag_col = f'Lag_{i}'
                data_processed[lag_col] = data_processed['Close'].shift(i)
                self.feature_columns.append(lag_col)

            # Drop rows with NaNs resulting from shifting
            data_processed.dropna(inplace=True)
            
            # Store the tail needed for bootstrapping future prediction (N prices preceding the first row of X)
            # We must use the original 'Close' data before lags were applied and NaNs dropped, hence the data.tail(self.lag_periods)
            self._history = data['Close'].tail(self.lag_periods).to_list()

        if data_processed.empty:
             raise ValueError(f"Data remaining after lag creation is empty (requires > {self.lag_periods} rows).")

        X = data_processed[self.feature_columns]
        y = data_processed['Close']
        
        return X, y

    def prepare_data(self, data: pd.DataFrame):
        """Prepares data for training, ensuring 'Days' and 'Close' exist, and creating lags."""
        if data.empty or 'Days' not in data.columns or 'Close' not in data.columns:
            raise ValueError("Input data must contain 'Days' and 'Close' columns.")

        X, y = self._create_lagged_features(data)
        
        # Track the starting day for prediction indexing
        self.last_known_day = X['Days'].max()
        
        return X, y

    def train_model(self, X, y, test_size=0.2):
        """Trains the model. Uses the full feature set X, applying scaling based on training data only."""
        
        min_required = self.lag_periods + 2 
        if len(X) < min_required:
             raise ValueError(f"Insufficient data points ({len(X)}) for reliable train/test split and lag creation.")

        # Set shuffle=False for time series data handling
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=self.random_state, shuffle=False)
        
        # APPLY SCALING: Fit on X_train, Transform X_train and X_test
        X_train_scaled = self._transform_data(X_train, fit=True)
        X_test_scaled = self._transform_data(X_test)

        self.model.fit(X_train_scaled, y_train)
        # Return scaled test set for evaluation
        return X_test_scaled, y_test

    def evaluate_model(self, X_test_scaled, y_test):
        """Evaluates the trained model on the (scaled) test set and returns RMSE and predictions."""
        if self.model is None:
            raise RuntimeError("Model must be trained before evaluation.")
            
        y_pred = self.model.predict(X_test_scaled)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        print(f"[{self.ticker}] Root Mean Squared Error (on Test Set): {rmse:.4f}")
        return y_pred

    def apply_market_sentiment(self, predictions: np.ndarray):
        """Applies a random multiplier to simulate market sentiment."""
        # Seeding here ensures sentiment application is reproducible per analysis run
        np.random.seed(self.random_state)
        sentiment = np.random.uniform(1 - self.sentiment_strength, 1 + self.sentiment_strength, size=len(predictions))
        return predictions * sentiment

    def predict_future(self, future_days: int) -> pd.DataFrame:
        """
        Predicts stock price for future days. Handles recursive forecasting if lags are used.
        Applies the fitted scaler to input features before prediction.
        """
        if self.model is None or self.last_known_day is None:
            raise RuntimeError("Analyzer not initialized or trained.")
            
        history_queue = self._history.copy() if self._history is not None else []
        future_results = []
        
        if self.lag_periods > 0 and len(history_queue) != self.lag_periods:
             raise RuntimeError(f"Internal state mismatch: history queue size ({len(history_queue)}) does not match lag periods ({self.lag_periods}).")

        for day_offset in range(1, future_days + 1):
            future_day_index = self.last_known_day + day_offset
            input_features_dict = {}
            
            # 1. Build features based on required self.feature_columns order
            for col in self.feature_columns:
                if col == 'Days':
                    input_features_dict['Days'] = future_day_index
                elif col.startswith('Lag_') and self.lag_periods > 0:
                    i = int(col.split('_')[1])
                    # Get the i-th most recent prediction/history price
                    price_idx = len(history_queue) - i
                    input_features_dict[col] = history_queue[price_idx]
                # Handle cases where self.lag_periods=0, only 'Days' is needed, other lag cols are skipped.

            # Convert features dictionary into a DataFrame row, preserving column order
            feature_values = [input_features_dict[col] for col in self.feature_columns]
            X_future = pd.DataFrame([feature_values], columns=self.feature_columns)
            
            # 2. Apply scaling using the fitted scaler
            X_future_scaled = self._transform_data(X_future)
            
            # Predict
            prediction = self.model.predict(X_future_scaled)[0]
            
            future_results.append({
                'Day': future_day_index,
                'Predicted_Price': prediction
            })
            
            # 3. Update history queue only if lags are used
            if self.lag_periods > 0:
                history_queue.pop(0) 
                history_queue.append(prediction)

        predictions_df = pd.DataFrame(future_results)
        
        predictions_df['Predicted_Price_W_Sentiment'] = self.apply_market_sentiment(
            predictions_df['Predicted_Price'].values
        )
        
        return predictions_df

def analyze_stock_pipeline(ticker, data, future_days=30):
    """Orchestrates the analysis using the StockAnalyzer class."""
    print(f"\n--- Analyzing {ticker} ---")
    try:
        # Initializing analyzer with lag features enabled (default lag_periods=3)
        analyzer = StockAnalyzer(ticker=ticker, lag_periods=3)
        X, y = analyzer.prepare_data(data)
        
        # X_test returned is now scaled
        X_test, y_test = analyzer.train_model(X, y)
        analyzer.evaluate_model(X_test, y_test)
        
        future_predictions_df = analyzer.predict_future(future_days)
        print(f"[{ticker}] Predicted prices for next {future_days} days (w/ sentiment):")
        print(future_predictions_df[['Day', 'Predicted_Price_W_Sentiment']].head())

    except (ValueError, RuntimeError, KeyError) as e:
        print(f"[{ticker}] Analysis Failed: {type(e).__name__}: {e}")

def main(stock_data):
    """Main function updated to use the new pipeline structure."""
    if stock_data:
        for ticker, data in stock_data.items():
            analyze_stock_pipeline(ticker, data)
    else:
        print("Failed to download any data.")

if __name__ == "__main__":
    # Example usage requires robust data for lags to function correctly (min 5 rows for lag=3 and split).
    stock_data = {
        'AAPL': pd.DataFrame({'Days': np.arange(10), 'Close': np.linspace(100, 150, 10)}),
        'GOOG': pd.DataFrame({'Days': np.arange(10), 'Close': np.linspace(500, 550, 10)})
    }
    main(stock_data)