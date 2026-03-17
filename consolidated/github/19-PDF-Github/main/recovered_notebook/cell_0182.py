import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def download_portfolio_data(tickers: list[str], start_date: str = None, end_date: str = None) -> pd.DataFrame | None:
    """
    Downloads historical stock data for multiple tickers efficiently using yfinance bulk download.
    Defaults to the last 5 years if no dates are provided.
    """
    if not tickers:
        print("Error: Ticker list cannot be empty.")
        return None
        
    if start_date is None:
        # Default to 5 years ago
        start_date = (datetime.now() - timedelta(days=5 * 365)).strftime('%Y-%m-%d')
    if end_date is None:
        end_date = datetime.now().strftime('%Y-%m-%d')

    print(f"Downloading data for {len(tickers)} tickers from {start_date} to {end_date}...")
    try:
        # Use yfinance's built-in bulk download feature
        data = yf.download(tickers=tickers, start=start_date, end=end_date, progress=False)
        return data
    except Exception as e:
        print(f"Failed to download bulk data for tickers {tickers}: {str(e)}")
        return None

def main():
    # Expanded and modernized list of relevant market tickers
    tickers = ['GE', 'T', 'GM', 'F', 'C', 'IBM', 'XOM', 'JNJ', 'PG', 'AAPL', 'MSFT', 'NVDA']
    
    # Define a specific time window for controlled data fetching
    START = '2019-01-01'
    END = '2024-01-01'

    portfolio_data = download_portfolio_data(tickers, start_date=START, end_date=END)
    
    if portfolio_data is not None:
        print("\n--- Download successful ---")
        print(f"Downloaded data shape (features, dates, tickers): {portfolio_data.shape}")
        
        # Accessing data example: Check the structure (MultiIndex or columns)
        if 'Adj Close' in portfolio_data.columns:
            adj_close_slice = portfolio_data['Adj Close']
        else:
             # Handle case where only one ticker was requested, resulting in single-level columns
             adj_close_slice = portfolio_data
             
        print("\nHead of Adjusted Close data (MultiIndex structure):")
        print(adj_close_slice.head())
        
    else:
        print("--- Download failed ---")

if __name__ == "__main__":
    main()