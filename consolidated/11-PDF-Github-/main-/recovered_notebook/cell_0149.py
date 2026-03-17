import logging
import os
import random
import requests
import hashlib
from typing import Tuple, List, Dict, Any
import re

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

COLORS = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

def get_random_color() -> str:
    """Returns a random color from the list of colors."""
    return random.choice(COLORS)

def simulate_corrupted_pdf() -> bytes:
    """Simulates corrupted PDF content (binary)."""
    return b"Corrupted PDF Content"

def simulate_clean_pdf() -> bytes:
    """Simulates clean PDF content (binary)."""
    # Ensuring the simulation text uses both US and potential European currency formats for robust testing
    return b"
Clean PDF Content
Payment to Vendor A: $100.55
Payment to Vendor B: 200,50 EUR
Expense for Council X: $500,000.50
Payment to Vendor C: 1.000.000,99 CHF (European style large number)
"

def download_url(url: str, timeout: int = 10, verify_ssl: bool = False) -> Tuple[bytes, int, str]:
    """
    Downloads content (treated as binary) from the given URL.

    Returns:
    Tuple[bytes, int, str]: A tuple containing the downloaded content (bytes), the status code, and the SHA256 hash.
    """
    try:
        if url.startswith("simulated_pdf:"):
            if "corrupted" in url:
                content = simulate_corrupted_pdf()
            else:
                content = simulate_clean_pdf()
            sha256_hash = hashlib.sha256(content).hexdigest()
            logging.info(f"[DOWNLOAD] Simulated Download: {url} (Checksum: {sha256_hash})")
            return content, 200, sha256_hash
        else:
            # Handle real downloads using binary content
            response = requests.get(url, timeout=timeout, verify=verify_ssl)
            response.raise_for_status()
            content = response.content
            sha256_hash = hashlib.sha256(content).hexdigest()
            logging.info(f"[DOWNLOAD] Downloaded: {url} (Size: {len(content)} bytes, Checksum: {sha256_hash})")
            return content, response.status_code, sha256_hash
    except requests.exceptions.RequestException as e:
        logging.error(f"[DOWNLOAD] Error downloading {url}: {e}")
        return b"", -1, ""

def extract_text_from_pdf(pdf_content: bytes) -> str:
    """
    Simulates extraction of text from binary PDF content.
    """
    try:
        text = pdf_content.decode('utf-8')
    except UnicodeDecodeError:
        logging.warning("Could not decode simulated content as UTF-8. Using raw repr.")
        text = str(pdf_content)

    if "Corrupted PDF Content" in text:
        return "Corrupted Content Placeholder"
        
    return text

def _parse_and_standardize_amount(raw_amount: str) -> float:
    """Converts a potentially localized amount string into a standard float.
    Handles common US (comma thousands, dot decimal) and European (dot thousands, comma decimal) formats.
    """
    raw_amount = raw_amount.strip()
    
    # Check for European format where comma is used as a decimal separator
    # E.g., 1.000.000,99 or 200,50
    if raw_amount.count(',') > 0 and raw_amount.rfind(',') > raw_amount.rfind('.'):
        # European format detected: Remove thousand separators (dots), replace decimal comma with dot.
        cleaned = raw_amount.replace('.', '').replace(',', '.')
    elif raw_amount.count(',') > 0:
        # Assume US format: Remove thousand separators (commas).
        cleaned = raw_amount.replace(',', '')
    else:
        # Simple dot decimal or integer
        cleaned = raw_amount

    try:
        return float(cleaned)
    except ValueError:
        logging.error(f"Failed to parse standardized amount string '{cleaned}' from raw '{raw_amount}'. Setting to 0.0")
        return 0.0

def extract_financial_data_from_text(text: str, council_name: str) -> List[Dict[str, Any]]:
    """
    Extracts financial data (including payee) from the given text.
    Refactored to standardize amounts to float for analytical consistency.
    """
    financial_data: List[Dict[str, Any]] = []
    
    # Group 1: Transaction Type (Payment to/Expense for)
    # Group 2: Payee/Context
    # Group 3: Optional Currency Symbol
    # Group 4: Numerical value (allows for digits, commas, and dots)
    structured_pattern = r'(Payment to|Expense for)\s+([A-Za-z0-9\s]+)[:]?\s*([$£€¥])?\s*(\d[\d,.]*)'
    
    amounts = re.findall(structured_pattern, text, re.IGNORECASE)
    
    for match in amounts:
        transaction_type = match[0].strip()
        payee = match[1].strip()
        # Default currency if not specified. Uses ISO codes for better tracking.
        currency = match[2].strip() if match[2] in ('$', '£', '€', '¥') else 'UNK'
        if currency == '$': currency = 'USD'
        elif currency == '£': currency = 'GBP'
        elif currency == '€': currency = 'EUR'
        elif currency == '¥': currency = 'JPY'
        
        amount_raw = match[3]
        amount_standardized = _parse_and_standardize_amount(amount_raw)
        
        financial_data.append({
            'council_name': council_name,
            'payee': payee,
            'type': transaction_type,
            'amount': amount_standardized,  # Stored as float
            'currency': currency
        })
        
    return financial_data

def main() -> None:
    url = "simulated_pdf:example_clean.pdf"
    content, status_code, sha256_hash = download_url(url)
    
    if status_code == 200 and content:
        text = extract_text_from_pdf(content)
        logging.info(f"[EXTRACTION] Extracted Text Snippet: {text[:50]}...")
        financial_data = extract_financial_data_from_text(text, "Example Council")
        logging.info(f"[FINANCIAL DATA] Extracted records: {len(financial_data)}")
        for item in financial_data:
             # Note: Format the output amount for display, but it's stored as float.
             logging.info(f"  -> {item['type']} to {item['payee']}: {item['currency']} {item['amount']:.2f}")
    else:
        logging.error("Pipeline failed at download stage.")

if __name__ == "__main__":
    main()