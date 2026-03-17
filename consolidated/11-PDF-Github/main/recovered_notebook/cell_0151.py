import re
import logging
from typing import List, Dict, Any

# Assuming jsonschema is installed
try:
    from jsonschema import validate, ValidationError
except ImportError:
    # Placeholder if execution environment lacks jsonschema
    class ValidationError(Exception): pass
    def validate(*args, **kwargs): 
        logging.warning("jsonschema dependency missing. Validation is disabled.")
        return True


def extract_vendor_name_from_preamble(
    text: str, vendor_keywords: List[str], amount_index: int
) -> str:
    """
    Replaced the fragmented vendor extraction loop. Finds the vendor name 
    located immediately before the detected amount, based on known keywords.
    Prioritizes the longest, most meaningful name found.
    """
    best_vendor_name = ""
    
    for keyword in vendor_keywords:
        # Search backwards from the amount location up to the start of the text
        keyword_index = text.rfind(keyword, 0, amount_index)
        
        if keyword_index != -1:
            vendor_start = keyword_index + len(keyword)
            vendor_end = amount_index
            potential_vendor = text[vendor_start:vendor_end].strip()

            # Aggressive normalization: remove non-essential punctuation and squish whitespace
            potential_vendor = re.sub(r'[\W_]+', ' ', potential_vendor)
            potential_vendor = re.sub(r'\s{2,}', ' ', potential_vendor).strip()
            
            # Ensure the name is substantive (at least 2 chars and contains alphanumeric content)
            if len(potential_vendor) >= 2 and any(c.isalnum() for c in potential_vendor):
                if len(potential_vendor) > len(best_vendor_name):
                    best_vendor_name = potential_vendor
                    
    return best_vendor_name


financial_data_schema = {
    "type": "array",
    "items": {
        "type": "object",
        "properties": {
            "council": {"type": "string", "description": "Source council/document ID."},
            "amount": {"type": "number"},
            "vendor": {"type": "string"},
            "currency": {"type": "string", "enum": ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "£", "$", "€"]},
        },
        "required": ["council", "amount", "vendor", "currency"],
        "additionalProperties": False
    }
}

def validate_financial_data(financial_data: List[Dict[str, Any]]) -> bool:
    """Validates data structure against the standard financial schema."""
    try:
        validate(instance=financial_data, schema=financial_data_schema)
        return True
    except ValidationError as e:
        logging.error(f"[VALIDATION] Financial data validation error: {e.message}")
        return False

def check_data_consistency(all_financial_data: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Performs cross-source consistency checks, detecting potential duplicate payments 
    based on identical Vendor, Amount, and Currency signatures across different documents.
    """
    inconsistencies: List[Dict[str, Any]] = []
    # Key: (Normalized Vendor Name, Rounded Amount, Currency)
    transaction_signatures: Dict[tuple, List[Dict[str, Any]]] = {}

    for source_id, records in all_financial_data.items():
        for record in records:
            # Robust consistency checks require heavy normalization (including fuzzy vendor matching),
            # but we use standard string normalization for initial flagging.
            vendor = record.get('vendor', '').upper().replace('.', '').replace(',', '').strip()
            amount = record.get('amount')
            currency = record.get('currency', '')

            if amount is not None and vendor and currency:
                # Use rounding to mitigate floating point comparison issues
                signature = (vendor, round(float(amount), 2), currency.upper())
                
                location_data = {"source_id": source_id, "record": record}

                if signature not in transaction_signatures:
                    transaction_signatures[signature] = []
                
                transaction_signatures[signature].append(location_data)

    # Step 2: Identify transactions appearing more than once
    for signature, locations in transaction_signatures.items():
        if len(locations) > 1:
            # This payment appears in multiple documents/records. Flag it.
            inconsistencies.append({
                "error": "Potential Duplicate Transaction",
                "reason": "Identical transaction signature (Vendor/Amount/Currency) found multiple times.",
                "signature_data": {
                    "vendor": signature[0],
                    "amount": signature[1],
                    "currency": signature[2]
                },
                "total_occurrences": len(locations),
                "sources": sorted(list(set(loc['source_id'] for loc in locations))),
                "details": locations
            })
            
    return inconsistencies