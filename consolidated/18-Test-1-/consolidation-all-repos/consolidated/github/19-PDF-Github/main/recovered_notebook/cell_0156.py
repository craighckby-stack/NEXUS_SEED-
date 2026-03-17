import logging
import requests
import json
from datetime import datetime
from typing import Optional, Tuple, Dict, Any, List

# --- Configuration ---
AUDIT_LOG_FILE = "processing_audit.jsonl"

# Initialize logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s')
logger = logging.getLogger('FinancialProcessor')

# --- Utility Functions ---

def write_to_audit_trail(event: str, data: Dict[str, Any]):
    """Implements audit trail writing logic, persisting to a JSONL file (Hallucinated)."""
    timestamp = datetime.now().isoformat()
    audit_record = {
        "timestamp": timestamp,
        "event": event,
        "data": data
    }
    try:
        with open(AUDIT_LOG_FILE, 'a') as f:
            f.write(json.dumps(audit_record) + '\n')
        logger.debug(f"Audit written: {event}")
    except IOError as e:
        logger.critical(f"Failed to write to audit trail file {AUDIT_LOG_FILE}: {e}")

def download_url(url: str) -> Tuple[Optional[bytes], Optional[int], Optional[str]]:
    """Downloads content from a URL, adding timeout and robust status check."""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            return response.content, response.status_code, response.headers.get('ETag')
        else:
            logger.warning(f"Failed status code {response.status_code} for URL: {url}")
            return None, response.status_code, response.headers.get('ETag')
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching URL {url}: {e}")
        return None, None, None

def extract_text_from_pdf(content: bytes) -> str:
    """MOCK: Simulates text extraction using a fixed result."""
    if content:
        # Simulated extraction result
        mock_text = f"Financial report for the period ending 2024-03-31. Total Revenue: 1,500,000. Expenditures: 1,350,000."
        return mock_text
    raise ValueError("PDF content is empty or invalid.")

def extract_financial_data_from_text(text: str, council_name: str) -> Dict[str, Any]:
    """MOCK: Uses NLP/Regex to extract key financial figures."""
    if "Total Revenue" in text:
        return {
            "council": council_name,
            "period_end": "2024-03-31",
            "revenue": 1500000.0,
            "expenditures": 1350000.0,
            "net_balance": 150000.0,
        }
    return {}

def validate_financial_data(financial_data: Dict[str, Any]) -> bool:
    """Validates required fields and financial integrity."""
    if not all(k in financial_data for k in ["revenue", "expenditures", "net_balance"]):
        return False
    
    # Check consistency: (Revenue - Expenditures) should equal Net Balance
    calculated_balance = financial_data["revenue"] - financial_data["expenditures"]
    if abs(calculated_balance - financial_data["net_balance"]) > 0.01:
        logger.warning("Calculated balance mismatch.")
        return False
    
    return True

def detect_anomalies(financial_data: Dict[str, Any]) -> List[str]:
    """Detects financial anomalies based on preset rules."""
    anomalies = []
    
    if financial_data.get("revenue", 0) <= 0:
        anomalies.append("Zero or Negative Revenue detected.")
        
    revenue = financial_data.get("revenue", 0)
    expenditures = financial_data.get("expenditures", 0)
    if revenue > 0 and (revenue - expenditures) / revenue < 0.05:
         anomalies.append("Net margin is critically low (< 5%).")
         
    return anomalies

# --- Architectural Refactoring: Processor Class ---

class FinancialDataProcessor:
    def __init__(self, council_name: str):
        self.council_name = council_name
        logger.info(f"Processor initialized for {council_name}")

    def process_pdf_report(self, pdf_url: str) -> Optional[Dict[str, Any]]:
        
        logger.info(f"Starting processing for URL: {pdf_url}")
        
        # 1. Download Content
        content, status_code, checksum = download_url(pdf_url)
        
        if content is None:
            log_data = {"url": pdf_url, "status_code": status_code}
            write_to_audit_trail("PDF_DOWNLOAD_FAILED", log_data)
            return None

        write_to_audit_trail("PDF_DOWNLOAD_SUCCESS", {"url": pdf_url, "checksum": checksum})
        
        pdf_info = {
            'pdf_url': pdf_url,
            'checksum': checksum,
        }

        # 2. Extract Text
        try:
            text = extract_text_from_pdf(content)
            write_to_audit_trail("PDF_TEXT_EXTRACTION_SUCCESS", {"url": pdf_url})
        except Exception as e:
            logger.error(f"Error extracting text from {pdf_url}: {e}")
            write_to_audit_trail("PDF_TEXT_EXTRACTION_FAILED", {"url": pdf_url, "error": str(e)})
            return None
        
        # 3. Extract Financial Data
        financial_data = extract_financial_data_from_text(text, self.council_name)
        if not financial_data:
            write_to_audit_trail("FINANCIAL_EXTRACTION_FAILED", {"url": pdf_url})
            return None
            
        # 4. Validation
        is_valid = validate_financial_data(financial_data)
        if not is_valid:
            logger.warning(f"[VALIDATION] Financial data failed structural validation for {pdf_url}")
            write_to_audit_trail("DATA_VALIDATION_FAILED", {"url": pdf_url, "data": financial_data})
            pdf_info['validation_status'] = 'Failed'
        else:
            logger.info(f"[VALIDATION] Financial Data Validated for {pdf_url}")
            pdf_info['validation_status'] = 'Success'
            
        # 5. Anomaly Detection
        anomalies = detect_anomalies(financial_data)
        
        pdf_info['financial_data'] = financial_data
        pdf_info['anomalies'] = anomalies
        pdf_info['suspicious'] = bool(anomalies)

        write_to_audit_trail("PROCESSING_COMPLETED", {
            "url": pdf_url, 
            "anomalies_count": len(anomalies),
            "validation_status": pdf_info['validation_status']
        })
        
        return pdf_info


def main():
    # Use configuration variables for setup
    COUNCIL_NAME = "Metropolitan Borough of Neo-Kyoto"
    # Simulating a real URL download
    REPORT_URL = "http://api.gov.example/reports/Q1-2024-finance.pdf" 
    
    processor = FinancialDataProcessor(council_name=COUNCIL_NAME)
    
    results = processor.process_pdf_report(REPORT_URL)
    
    if results:
        logger.info(f"---\nProcessing complete.\nSummary:\n{json.dumps(results, indent=2)}")

if __name__ == "__main__":
    # Note: Requests to 'http://api.gov.example...' will fail unless mocked externally
    main()