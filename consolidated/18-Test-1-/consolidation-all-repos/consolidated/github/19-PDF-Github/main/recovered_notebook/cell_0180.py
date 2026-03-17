import yfinance as yf
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import pandas as pd
from typing import Tuple, Dict, List, Any
import numpy as np

def get_historical_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame | None:
    """
    Fetches historical stock data from Yahoo Finance. Handles potential errors due to data unavailability.
    """
    try:
        # Adjusted=True often preferred for modeling, but sticking to original parameters for 'Close' prediction.
        data = yf.download(ticker, start=start_date, end=end_date, auto_adjust=False)
        if data.empty:
            print(f"No data found for {ticker} in the specified period.")
            return None
        return data
    except Exception as e:
        print(f"Error fetching data for {ticker}: {e}")
        return None

def prepare_data(data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Prepares data for the linear regression model, incorporating simple time-series features.
    Features now include Day count, lagged price, 5-day Moving Average, and Volume.
    """
    df = data.copy()
    
    # 1. Time Feature
    df['Date'] = df.index
    df['Date'] = pd.to_datetime(df['Date'])
    df['Days'] = (df['Date'] - df['Date'].min()).dt.days
    
    # 2. Simple Technical Features
    df['Close_Lag1'] = df['Close'].shift(1)  # Previous day's close
    df['MA_5'] = df['Close'].rolling(window=5).mean() # 5-day Moving Average
    
    df = df.dropna()
    
    # Use multiple features
    X = df[['Days', 'Close_Lag1', 'MA_5', 'Volume']]
    y = df['Close']
    
    return X, y

def train_model(X: pd.DataFrame, y: pd.Series) -> Tuple[LinearRegression, float, float, np.ndarray]:
    """
    Trains a linear regression model.
    
    Returns:
        tuple: Trained model, mean squared error, intercept, and coefficients.
    """
    # Ensure enough samples for split
    if len(X) < 5:
        raise ValueError("Not enough data points to perform train/test split.")
        
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, shuffle=False) # Shuffle=False for time series orientation
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    
    return model, mse, model.intercept_, model.coef_

def main():
    # Configuration moved to variables
    SP500_TICKERS = ['GE', 'T', 'GM', 'F', 'C', 'IBM', 'XOM', 'JNJ', 'PG', 'MMM'] # Added one more for robustness
    START_DATE = "1928-01-01"
    END_DATE = "1930-01-01"

    print(f"Modeling data from {START_DATE} to {END_DATE}")
    
    stock_data: Dict[str, pd.DataFrame] = {}
    for ticker in SP500_TICKERS:
        data = get_historical_data(ticker, START_DATE, END_DATE)
        if data is not None:
            stock_data[ticker] = data

    results: List[Dict[str, Any]] = []
    
    for ticker, data in stock_data.items():
        try:
            X, y = prepare_data(data)
            
            # Ensure sufficient prepared data points
            if len(X) < 10:
                 print(f"Skipping {ticker}: Insufficient data after preparation.")
                 continue
                 
            model, mse, intercept, coef = train_model(X, y)
            
            feature_names = X.columns.tolist()
            coef_dict = dict(zip(feature_names, coef))
            
            results.append({
                'ticker': ticker,
                'mse': mse,
                'intercept': intercept,
                'coefficients': coef_dict
            })
            
            print(f"\n--- Results for {ticker} ---")
            print(f"MSE: {mse:.4f}")
            print(f"Coefficients: {coef_dict}")
            
        except Exception as e:
            print(f"Error processing {ticker}: {e}")

if __name__ == "__main__":
    main()
