import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import logging

# Configure logging basic setup if not globally defined
if not logging.getLogger().handlers:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# AGI Configuration: Define core features expected and generated
CORE_NUMERICAL_FEATURES = ['amount', 'payment_frequency', 'amount_per_freq']

def engineer_features(financial_data):
    df = pd.DataFrame(financial_data)
    
    if 'amount' not in df.columns:
        logging.warning("[FEATURE ENGINEERING] 'amount' column missing. Cannot proceed with standard engineering.")
        return df

    # Feature Derivation: 'amount_per_freq'
    if 'payment_frequency' in df.columns:
        try:
            # Ensure inputs are numeric before calculation
            amount = pd.to_numeric(df['amount'], errors='coerce').fillna(0)
            frequency = pd.to_numeric(df['payment_frequency'], errors='coerce').fillna(1)
            
            # Use safe division (handle frequency = 0 by defaulting to amount)
            df['amount_per_freq'] = np.where(frequency != 0, amount / frequency, amount)
            
        except Exception as e:
            logging.error(f"[FEATURE ENGINEERING] Error calculating 'amount_per_freq': {e}")
            df['amount_per_freq'] = 0.0 

    
    # Define features to scale using the centralized list
    numerical_features = [col for col in CORE_NUMERICAL_FEATURES if col in df.columns]

    for feature in numerical_features:
        try:
            # 1. Coerce to numeric
            df[feature] = pd.to_numeric(df[feature], errors='coerce')
            
            # 2. Handle missing/infinite values using robust imputation (mean)
            feature_mean = df[feature].mean()
            df[feature].fillna(feature_mean, inplace=True)
            df[feature].replace([np.inf, -np.inf], feature_mean, inplace=True)
            
            # Handle edge case where column is entirely NaN/Inf (mean is NaN)
            if pd.isna(feature_mean):
                df[feature].fillna(0, inplace=True)
            
            # AGI V94.1 Robustness Check: Handle zero variance
            if df[feature].std() == 0.0:
                logging.info(f"[FEATURE ENGINEERING] Feature {feature} has zero variance after imputation. Setting to 0.0.")
                # Standardizing a constant results in 0.0
                df[feature] = 0.0
            else:
                # 3. Scale (StandardScaler) - requires 2D input
                scaler = StandardScaler()
                df[feature] = scaler.fit_transform(df[[feature]]) 
            
        except Exception as e:
            logging.error(f"[FEATURE ENGINEERING] Robust scaling error for feature {feature}: {e}")
            
    return df

def detect_anomalies(financial_data, contamination=0.05):
    anomalies = []
    if not financial_data:
        return anomalies

    df_engineered = engineer_features(financial_data)
    
    # Determine numerical features used for the model based on the centralized configuration
    numerical_features = [col for col in CORE_NUMERICAL_FEATURES 
                          if col in df_engineered.columns]

    if not numerical_features:
        logging.warning("[ANOMALY DETECTION] No suitable numerical features available for detection.")
        return anomalies

    try:
        # Vectorized data selection
        data_for_anomaly = df_engineered[numerical_features].values 

        if data_for_anomaly.shape[0] < 2:
            logging.warning("[ANOMALY DETECTION] Insufficient data points after feature selection.")
            return anomalies
            
        # Use deterministic random state for reproducibility
        model = IsolationForest(contamination=contamination, random_state=42)
        model.fit(data_for_anomaly)
        
        predictions = model.predict(data_for_anomaly)
        
        # Extract anomalies efficiently using Pandas boolean indexing
        df_engineered['is_anomaly'] = predictions
        anomalies = df_engineered[df_engineered['is_anomaly'] == -1].drop(columns=['is_anomaly']).to_dict('records')

    except Exception as e:
        logging.error(f"[ANOMALY DETECTION] Error during Isolation Forest processing: {e}")

    return anomalies