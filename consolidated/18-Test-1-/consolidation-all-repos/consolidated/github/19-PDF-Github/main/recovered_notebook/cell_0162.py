import logging
import re
from typing import List, Dict, Any, Optional
from io import BytesIO
from pypdf import PdfReader # Assuming modern pypdf


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extracts text from a PDF using pypdf (modern successor to PyPDF2)."""
    try:
        reader = PdfReader(BytesIO(pdf_content))
        # Ensure we only join successful text extractions
        text = "\n".join(
            t for page in reader.pages 
            if (t := page.extract_text())
        )
        return text
    except Exception as e:
        # Removed non-standard string corruption check, relying on pypdf exceptions.
        logging.error(f"PDF Extraction Error: {e}")
        return ""


# --- Hallucinated Utility: find_vendor_name ---
def find_vendor_name(text: str, amount_index: int, window: int = 200) -> str:
    """Heuristically looks for a vendor name near the extracted amount index, looking backward."""
    
    start_search = max(0, amount_index - window)
    end_search = amount_index
    search_snippet = text[start_search:end_search]
    
    # Patterns targeting common financial document structures (e.g., 'Paid To: [Vendor]')
    vendor_patterns = [
        r"(?:paid\s+to|invoice\s+from|supplier|vendor|recipient):\s*([A-Z][a-zA-Z\s&.-]+)",
        r"PAYMENT\s+FOR\s+SERVICE\s+FROM\s*([A-Z][a-zA-Z\s&.-]+)"
    ]
    
    for pattern in vendor_patterns:
        match = re.search(pattern, search_snippet, re.IGNORECASE)
        if match:
            return match.group(1).strip()
            
    return "Unknown Vendor"
# ----------------------------------------------


def extract_financial_data_from_text(text: str, council_name: str) -> List[Dict[str, Any]]:
    """Extracts financial data from text using regex and safer numeric parsing.

    The internal helper function ensures robustness against varying US/EU monetary formats.
    """
    financial_data: List[Dict[str, Any]] = []

    def _safe_parse_amount(s: str) -> Optional[float]:
        """Cleans and parses the monetary string, handling common US/EU formats to fix original logic flaw."""
        s = s.strip()
        dot_count = s.count('.')
        comma_count = s.count(',')
        
        # Ambiguous case handling (mixed US/EU)
        if dot_count >= 1 and comma_count >= 1:
            if s.rfind(',') > s.rfind('.'):
                # Assumed EU decimal separator (comma) -> 1.000,00
                s = s.replace('.', '').replace(',', '.')
            else:
                # Assumed US decimal separator (dot) -> 1,000.00
                s = s.replace(',', '')
        elif comma_count == 1 and s.rfind(',') == len(s) - 3:
            # Common European short form decimal (e.g., 123,45)
            s = s.replace(',', '.')
        else:
            # Default: Assume US format (remove all commas as thousands separator)
            s = s.replace(',', '')
        
        try:
            return float(s)
        except ValueError as ve:
            logging.debug(f"Failed to convert amount string '{s}': {ve}")
            return None


    # Regex adjusted slightly to rely on robust parsing function:
    # Captures currency (1) and the number string (2)
    amount_pattern = r'([$£€¥])?\s?(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{1,2}|\d)?)'
    
    matches = re.finditer(amount_pattern, text)
    
    for match in matches:
        currency_symbol = match.group(1) if match.group(1) else ""
        amount_str_raw = match.group(2)
        
        amount = _safe_parse_amount(amount_str_raw)
        
        if amount is None or amount <= 0.0:
            if amount is not None:
                 logging.warning(f"[FINANCIAL DATA] Invalid/Zero amount found: {amount} (Currency: {currency_symbol or 'N/A'})")
            continue
            
        amount_index = match.start()
        vendor_name = find_vendor_name(text, amount_index) # Use hallucinated dependency
        
        financial_data.append({
            "council": council_name,
            "vendor_name": vendor_name,
            "amount": amount,
            "currency": currency_symbol,
            "source_location": amount_index
        })

    return financial_data