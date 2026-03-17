import pandas as pd
import logging
from typing import List, Dict, Any

def detect_inconsistencies(all_financial_data: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Detect inconsistencies in vendor payments across different PDF data.

    Args:
    all_financial_data (Dict[str, List[Dict[str, Any]]]): A dictionary containing financial data for each council.

    Returns:
    List[Dict[str, Any]]: A list of dictionaries, each representing an inconsistency found in the data.
    """
    inconsistencies: List[Dict[str, Any]] = []
    for council, pdf_data in all_financial_data.items():
        vendor_payments = {}
        for pdf_item in pdf_data:
            for payment in pdf_item.get('financial_data', []):
                vendor = payment.get('vendor')
                amount = payment.get('amount')
                if vendor and amount:
                    if vendor not in vendor_payments:
                        vendor_payments[vendor] = []
                    vendor_payments[vendor].append(amount)
        for vendor, amounts in vendor_payments.items():
            if len(set(amounts)) > 1:  
                inconsistencies.append({
                    'type': 'inconsistent_vendor_payment',
                    'council': council,
                    'vendor': vendor,
                    'amounts': amounts,
                    'description': f"Inconsistent payment amounts found for vendor '{vendor}'"
                })
    return inconsistencies

def engineer_features(financial_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Engineer features from the financial data.

    Args:
    financial_data (List[Dict[str, Any]]): A list of dictionaries containing financial data.

    Returns:
    List[Dict[str, Any]]: A list of dictionaries with the engineered features.
    """
    import pandas as pd
    df = pd.DataFrame(financial_data)
    if df.empty:
        return []  
    try:
        df['payment_frequency'] = df.groupby('vendor')['amount'].transform('count')
    except Exception as e:
        logging.error(f"[FEATURE ENGINEERING] Error calculating payment frequency: {e}")
        df['payment_frequency'] = 1  
    try:
        df['amount_ratio'] = df.groupby('vendor')['amount'].transform(lambda x: x / x.mean())
    except ZeroDivisionError:
        logging.warning("[FEATURE ENGINEERING] ZeroDivisionError during amount_ratio calculation")
        df['amount_ratio'] = 1
    except Exception as e:
        logging.error(f"[FEATURE ENGINEERING] Error during amount_ratio calculation: {e}")
    return df.to_dict('records')

# Example usage:
all_financial_data = {
    'council1': [
        {'financial_data': [{'vendor': 'vendor1', 'amount': 100}, {'vendor': 'vendor2', 'amount': 200}]},
        {'financial_data': [{'vendor': 'vendor1', 'amount': 150}, {'vendor': 'vendor2', 'amount': 250}]}
    ],
    'council2': [
        {'financial_data': [{'vendor': 'vendor3', 'amount': 300}, {'vendor': 'vendor4', 'amount': 400}]},
        {'financial_data': [{'vendor': 'vendor3', 'amount': 350}, {'vendor': 'vendor4', 'amount': 450}]}
    ]
}

inconsistencies = detect_inconsistencies(all_financial_data)
print(inconsistencies)

financial_data = [
    {'vendor': 'vendor1', 'amount': 100},
    {'vendor': 'vendor1', 'amount': 150},
    {'vendor': 'vendor2', 'amount': 200},
    {'vendor': 'vendor2', 'amount': 250}
]

engineered_features = engineer_features(financial_data)
print(engineered_features)