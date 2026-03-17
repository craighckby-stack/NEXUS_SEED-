import logging
import os
import csv
import datetime
from typing import Dict, Any, List
from sklearn.ensemble import IsolationForest
import numpy as np

# --- Utility Functions ---

def write_to_audit_trail(action: str, details: Dict[str, Any], audit_file: str = "audit_trail.csv"):
    """Writes an entry to the audit trail (CSV format)."""
    timestamp = datetime.datetime.now().isoformat()
    log_entry = {
        'timestamp': timestamp,
        'action': action,
        'details': details
    }
    
    fieldnames = ['timestamp', 'action', 'details']
    
    # Ensure details is serializable for CSV (especially if details contains complex dicts/objects)
    log_entry['details'] = str(details)

    file_exists = os.path.exists(audit_file)
    
    try:
        with open(audit_file, 'a', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            if not file_exists:
                writer.writeheader()  # Write header only if file is new
            writer.writerow(log_entry)
            logging.debug(f"[AUDIT TRAIL] Logged action '{action}'.")
    except Exception as e:
        logging.error(f"[AUDIT TRAIL] Error writing to audit file {audit_file}: {e}")


# --- Main Anomaly Detection Logic ---

def run_isolation_forest_analysis(
    records: List[Dict[str, Any]],
    data_matrix: np.ndarray,
    contamination: float = 0.01,
    random_state: int = 42
) -> List[Dict[str, Any]]:
    """Runs Isolation Forest on the data matrix and tags anomalies in the records.
    
    Args:
        records: The list of original financial transaction dictionaries.
        data_matrix: The corresponding feature matrix (NumPy array) for IF input.
        contamination: The expected proportion of outliers in the data.
    
    Returns:
        A list containing only the detected anomaly records.
    """
    anomalies = []
    
    if len(records) != len(data_matrix):
        logging.error("[ANOMALY DETECTION] Record count mismatch between records and data matrix.")
        write_to_audit_trail('ERROR', {'error': 'Record count mismatch', 'source': 'IsolationForest preparation'})
        return []
        
    try:
        # Anomaly detection using Isolation Forest
        model = IsolationForest(contamination=contamination, random_state=random_state)
        model.fit(data_matrix)
        
        anomaly_scores = model.decision_function(data_matrix)
        anomaly_predictions = model.predict(data_matrix)
        
        total_anomalies_detected = 0

        for i, item in enumerate(records):
            score = anomaly_scores[i]
            prediction = anomaly_predictions[i]
            is_anomaly = prediction == -1
            
            # Mutate the original item to include scores/predictions
            item['anomaly_score'] = score
            item['anomaly_model_prediction'] = prediction
            
            if is_anomaly:
                total_anomalies_detected += 1
                amount = item.get('amount', 'N/A')
                vendor = item.get('vendor', 'N/A')
                
                logging.warning(f"[ANOMALY DETECTED] Amount ${amount} | Score {score:.4f}")
                anomalies.append(item)
                
                # Write critical anomaly finding to the permanent audit trail
                audit_details = {
                    'record_index': i,
                    'amount': amount,
                    'vendor': vendor,
                    'score': score
                }
                write_to_audit_trail('Anomaly Detected (IsolationForest)', audit_details)
            else:
                logging.debug(f"[ANOMALY DETECTION] Normal score: {score:.4f}")
                
        logging.info(f"[ANOMALY DETECTION] Analysis complete. Total anomalies found: {total_anomalies_detected}")
        write_to_audit_trail('Analysis Summary', {'model': 'IsolationForest', 'total_records': len(records), 'anomalies_found': total_anomalies_detected})

    except Exception as e:
        logging.error(f"[ANOMALY DETECTION] Anomaly detection critical failure: {e}")
        write_to_audit_trail('CRITICAL ERROR', {'error': str(e), 'model': 'IsolationForest'})
        return []

    return anomalies