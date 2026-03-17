import re
import logging
from typing import List, Dict, Any

# Configure logging (for demonstration)
# logging.basicConfig(level=logging.INFO)

def _clean_and_convert_amount(match: re.Match) -> float:
    """
    Cleans and converts a regex match object containing financial amount to a float.
    This implementation uses heuristics based on grouping/decimal separators captured 
    to handle common US (1,000.00) and European (1.000,00) formats robustly.
    
    Args:
    - match (re.Match): The match object from the amount_pattern regex.
    
    Returns:
    - float: The converted numerical value.
    
    Raises:
    - ValueError: If conversion fails.
    """
    amount_str = match.group(2)
    decimal_part = match.group(3)
    
    if not amount_str:
        raise ValueError("Empty amount string provided.")

    # Default assumption
    cleaned_str = amount_str

    if decimal_part:
        # Determine the true decimal separator based on the captured cents group
        decimal_separator = decimal_part[0]
        
        if decimal_separator == ',':
            # European format detected (e.g., 1.000,00). Remove dots (grouping), replace comma with dot (decimal).
            cleaned_str = amount_str.replace('.', '').replace(',', '.')
        else:
            # US/Standard format detected (e.g., 1,000.00). Remove commas (grouping).
            cleaned_str = amount_str.replace(',', '')
    else:
        # No decimal part captured (e.g., 1000 or 1,000). Assume US grouping or clean integer.
        cleaned_str = amount_str.replace(',', '')
        
    return float(cleaned_str)


def _find_vendor_context(text: str, amount_index: int, vendor_keywords: List[str]) -> str:
    """
    Finds the transactional context (potential vendor name) preceding the amount.
    Prioritizes the closest match backward from the amount index.

    Args:
    - text (str): The text to search for the vendor name.
    - amount_index (int): The index of the amount in the text.
    - vendor_keywords (List[str]): A list of keywords identifying transactions.

    Returns:
    - str: The context phrase if found, otherwise an empty string.
    """
    best_vendor_name = ""
    best_distance = float('inf')

    for keyword in vendor_keywords:
        # Search backwards from the amount position
        keyword_index = text.rfind(keyword, 0, amount_index)
        
        if keyword_index != -1:
            # Extract the text between the keyword and the amount
            vendor_context = text[keyword_index + len(keyword):amount_index].strip()
            
            # Cleanup common trailing noise (e.g., 'to Vendor:' -> 'Vendor')
            vendor_context = re.sub(r'[\s\-:;,./]+$', '', vendor_context)
            
            distance = amount_index - keyword_index
            
            if distance < best_distance and vendor_context:
                best_distance = distance
                best_vendor_name = vendor_context

    return best_vendor_name


def extract_financial_data(text: str, council_name: str, vendor_keywords: List[str]) -> List[Dict[str, Any]]:
    """
    Extract financial data (amounts, currencies, and nearby vendor context) from a given text.

    Args:
    - text (str): The text to extract financial data from.
    - council_name (str): The name of the council.
    - vendor_keywords (List[str]): A list of keywords to identify vendors/recipients.

    Returns:
    - List[Dict[str, Any]]: A list of dictionaries containing the extracted financial data.
    """
    financial_data = []
    # Improved regex to capture optional currency symbols, large numbers with grouping, and optional cents.
    amount_pattern = r'([$£€¥]?)\s?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)'
    matches = re.finditer(amount_pattern, text)

    for match in matches:
        try:
            currency_symbol = match.group(1).strip()
            
            # Step 1: Robustly parse the amount using the helper
            amount = _clean_and_convert_amount(match)

            if amount <= 0:
                logging.debug(f"[FINANCIAL DATA] Skipping non-positive amount: {amount}")
                continue

            amount_index = match.start()
            
            # Step 2: Find the nearest vendor context
            vendor_context = _find_vendor_context(text, amount_index, vendor_keywords)

            if vendor_context:
                financial_data.append({
                    'council': council_name,
                    'amount': amount,
                    'vendor': vendor_context,
                    # Changed default currency placeholder from hardcoded "USD" to "N/A"
                    'currency': currency_symbol if currency_symbol else "N/A"
                })
                logging.info(f"[FINANCIAL DATA] Extracted: {currency_symbol}{amount:.2f} to '{vendor_context}'")
        except ValueError as ve:
            logging.warning(f"[FINANCIAL DATA] Could not convert amount to float: '{match.group()}' Error: {ve}")
        except Exception as e:
            logging.error(f"[FINANCIAL DATA] Unexpected error processing financial data: {e}")

    return financial_data


# Example usage
text = "Payment to Vendor1 $100.00 and paid to Corporation B, €200.55. A small charge of 10. Council spending £1,000,000.50"
council_name = "Example Council"
vendor_keywords = ["payment to", "paid to", "spending", "charge of"]

financial_data = extract_financial_data(text, council_name, vendor_keywords)
print(financial_data)