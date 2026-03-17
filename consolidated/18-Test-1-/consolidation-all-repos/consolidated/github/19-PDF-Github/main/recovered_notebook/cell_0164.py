import json
from jsonschema import validate, ValidationError
import logging
from typing import Any, Dict, List

# Define the financial data schema
financial_data_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "council": {"type": "string"},
            "amount": {"type": "number"},
            "vendor": {"type": "string"},
            "currency": {"type": "string", "enum": ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]},
        },
        "required": ["council", "amount", "vendor", "currency"],
        "additionalProperties": False
    }
}

def validate_financial_data(financial_data: List[Dict[str, Any]]) -> bool:
    """
    Validates financial data against the schema.

    Args:
    financial_data (List[Dict[str, Any]]): The financial data to be validated.

    Returns:
    bool: True if the data is valid, False otherwise.
    """
    try:
        validate(instance=financial_data, schema=financial_data_schema)
        return True
    except ValidationError as e:
        logging.error(f"[VALIDATION] Financial data validation error: {e}")
        return False

def check_data_consistency(all_financial_data: Dict[str, List[Dict[str, Any]]]) -> List[Dict]:
    """
    Checks for inconsistencies across different data sources.

    Args:
    all_financial_data (Dict[str, List[Dict[str, Any]]]): The financial data from all sources.

    Returns:
    List[Dict]: A list of inconsistencies found in the data.
    """
    inconsistencies: List[Dict] = []
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
    Engineers features for anomaly detection. Uses Pandas for efficiency.

    Args:
    financial_data (List[Dict[str, Any]]): The financial data to be engineered.

    Returns:
    List[Dict[str, Any]]: The engineered features.
    """
    # Import pandas for efficiency
    import pandas as pd
    
    # Convert the financial data to a pandas DataFrame
    df = pd.DataFrame(financial_data)
    
    # Engineer features here...
    # For example, calculate the total amount for each vendor
    df['total_amount'] = df.groupby('vendor')['amount'].transform('sum')
    
    # Convert the DataFrame back to a list of dictionaries
    engineered_features = df.to_dict('records')
    
    return engineered_features

# Example usage:
if __name__ == "__main__":
    # Define some example financial data
    financial_data = [
        {"council": "Council A", "amount": 100.0, "vendor": "Vendor X", "currency": "USD"},
        {"council": "Council A", "amount": 200.0, "vendor": "Vendor Y", "currency": "EUR"},
        {"council": "Council B", "amount": 50.0, "vendor": "Vendor X", "currency": "USD"},
        {"council": "Council B", "amount": 75.0, "vendor": "Vendor Y", "currency": "EUR"}
    ]
    
    # Validate the financial data
    is_valid = validate_financial_data(financial_data)
    print(f"Financial data is valid: {is_valid}")
    
    # Check for inconsistencies in the data
    all_financial_data = {
        "Council A": financial_data[:2],
        "Council B": financial_data[2:]
    }
    inconsistencies = check_data_consistency(all_financial_data)
    print("Inconsistencies:")
    for inconsistency in inconsistencies:
        print(inconsistency)
    
    # Engineer features for anomaly detection
    engineered_features = engineer_features(financial_data)
    print("Engineered features:")
    for feature in engineered_features:
        print(feature)