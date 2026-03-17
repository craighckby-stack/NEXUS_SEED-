import logging
import hashlib
from typing import Dict, Any, Tuple, List, Optional, TypedDict
import random # Added for mocks

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Custom Exceptions (For robust flow control) ---
class ProcessingError(Exception):
    """Base class for PDF processing errors."""
    pass

class TextExtractionError(ProcessingError):
    pass

# --- Structured Result Definitions (Architectural Improvement) ---

class FinancialDataResult(TypedDict):
    council: str
    total_budget_local_currency: int
    report_date: str

class PDFProcessingResult(TypedDict):
    pdf_url: str
    checksum: Optional[str]
    status: str  # e.g., 'SUCCESS', 'BLOCKED_BY_ROBOTS', 'DOWNLOAD_FAILED', 'EXTRACTION_FAILED'
    financial_data: Optional[FinancialDataResult]
    anomalies: List[str]
    is_valid: bool
    suspicious: bool
    error_message: Optional[str]

# --- Placeholder Implementations (Mocks defining clear interfaces) ---

def is_allowed_by_robots(pdf_url: str, rp: Any, user_agent: str) -> bool:
    # Implement robots.txt checking logic here
    # Returns True/False
    return True

def download_url(pdf_url: str, user_agent: str) -> Tuple[bytes, int, str]:
    # Returns (content: bytes, status_code: int, checksum: str)
    content = f"Mock financial report content for {pdf_url}".encode('utf-8')
    checksum = hashlib.sha256(content).hexdigest()
    return content, 200, checksum

def extract_text_from_pdf(content: bytes) -> str:
    # Implement PDF text extraction logic here
    if not content:
        raise TextExtractionError("Empty content provided for text extraction.")
    # Mock successful extraction
    return content.decode('utf-8')

def extract_financial_data_from_text(text: str, council_name: str) -> Dict[str, Any]:
    # Implement financial data extraction logic here (NLP/Regex)
    return {
        'council': council_name,
        'total_budget_local_currency': random.randint(10000000, 90000000),
        'report_date': '2022-12-31'
    }

def validate_financial_data(financial_data: Dict[str, Any]) -> bool:
    # Implement financial data validation logic here
    return financial_data.get('total_budget_local_currency', 0) > 1000000

def detect_anomalies(financial_data: Dict[str, Any]) -> List[str]:
    # Implement anomaly detection logic here
    if financial_data.get('total_budget_local_currency', 0) > 80000000:
        return ["Budget exceeds historical 3-sigma deviation."]
    return []

def write_to_audit_trail(event: str, data: Dict[str, Any]):
    # Implement audit trail writing logic here
    logging.debug(f"[AUDIT] Event: {event}, Data: {data}")

# --- Refactored Pipeline Components (Helper functions focus on single responsibility) ---

def _process_download(pdf_url: str, user_agent: str, rp: Any) -> Tuple[Optional[bytes], Optional[str], Optional[int]]:
    """Handles robots check and downloading."""
    if not is_allowed_by_robots(pdf_url, rp, user_agent):
        write_to_audit_trail("PDF Download Blocked by Robots.txt", {"url": pdf_url})
        return None, None, 403

    content, status_code, checksum = download_url(pdf_url, user_agent=user_agent)

    if status_code != 200:
        write_to_audit_trail("PDF Download Failed", {"url": pdf_url, "status_code": status_code})
        return None, None, status_code

    return content, checksum, status_code

def _analyze_content(content: bytes, council_name: str, checksum: str) -> Tuple[Dict[str, Any], List[str], bool]:
    """Handles extraction, data parsing, validation, and anomaly detection."""
    
    # 3. Text Extraction
    try:
        text = extract_text_from_pdf(content)
        write_to_audit_trail("PDF Text Extraction Successful", {"checksum": checksum})
    except TextExtractionError as e:
        raise ProcessingError(f"Extraction error: {e}")
    except Exception as e:
        raise ProcessingError(f"Unexpected extraction error: {e}")

    # 4. Financial Data Extraction
    financial_data = extract_financial_data_from_text(text, council_name)
    write_to_audit_trail("Financial Data Extraction Complete", {"checksum": checksum})

    # 5. Validation
    is_valid = validate_financial_data(financial_data)
    if not is_valid:
        write_to_audit_trail("Financial Data Validation Failed", {"checksum": checksum})
    
    # 6. Anomaly Detection
    anomalies = detect_anomalies(financial_data)
    write_to_audit_trail("Anomaly Detection Complete", {"checksum": checksum, "anomaly_count": len(anomalies)})

    return financial_data, anomalies, is_valid


def execute_pdf_pipeline(pdf_url: str, council_name: str, user_agent: str, rp: Any) -> PDFProcessingResult:
    """
    Orchestrates the PDF processing pipeline, returning a standardized result object.
    This function is now designed to be functionally pure regarding state mutation (it returns data).
    """
    result: PDFProcessingResult = {
        'pdf_url': pdf_url,
        'checksum': None,
        'status': 'PENDING',
        'financial_data': None,
        'anomalies': [],
        'is_valid': False,
        'suspicious': False,
        'error_message': None
    }
    
    try:
        # 1 & 2. Download and Robots Check
        content, checksum, status_code = _process_download(pdf_url, user_agent, rp)
        result['checksum'] = checksum

        if content is None:
            if status_code == 403:
                result['status'] = 'BLOCKED_BY_ROBOTS'
                logging.warning(f"[ROBOTS] Skipping {pdf_url}")
            else:
                result['status'] = 'DOWNLOAD_FAILED'
                result['error_message'] = f"HTTP Status: {status_code}"
                logging.error(f"Download failed for {pdf_url}. Status: {status_code}")
            return result

        # 3-6. Analysis and Extraction
        financial_data, anomalies, is_valid = _analyze_content(content, council_name, checksum)

        # 7. Structure Output
        result['status'] = 'SUCCESS'
        result['financial_data'] = financial_data
        result['anomalies'] = anomalies
        result['is_valid'] = is_valid
        result['suspicious'] = bool(anomalies)
        
        if anomalies:
            logging.warning(f"Suspicious PDF detected: {pdf_url} ({len(anomalies)} anomalies).")
            
    except ProcessingError as e:
        result['status'] = 'EXTRACTION_FAILED'
        result['error_message'] = str(e)
        logging.error(f"Pipeline failed for {pdf_url} during analysis: {e}")
    except Exception as e:
        result['status'] = 'UNEXPECTED_ERROR'
        result['error_message'] = f"Unhandled error: {type(e).__name__} - {str(e)}"
        logging.critical(f"Critical unhandled error in pipeline for {pdf_url}: {e}")
        
    return result

# --- Example Usage (Aggregation layer moved outside pipeline function) ---

def aggregate_result(result: PDFProcessingResult, timestamp: str, all_data: Dict[str, Any]):
    council_name = result['financial_data']['council'] if result['financial_data'] else 'Unknown Council'
    
    # 8. Data Aggregation (Mutation)
    if council_name not in all_data:
        all_data[council_name] = {'snapshots': {}}

    if timestamp not in all_data[council_name]['snapshots']:
        all_data[council_name]['snapshots'][timestamp] = []

    # Clean result for aggregation
    aggregated_info = {
        'pdf_url': result['pdf_url'],
        'checksum': result['checksum'],
        'status': result['status'],
        'financial_data': result['financial_data'],
        'anomalies': result['anomalies'],
        'is_valid': result['is_valid']
    }

    all_data[council_name]['snapshots'][timestamp].append(aggregated_info)

pdf_url = "https://example.com/pdf.pdf"
council_name = "Example Council"
timestamp = "2022-01-01"
all_data = {}
user_agent = "Example User Agent"
rp = "Example Robots Parser"

# Execute Pipeline
processing_output = execute_pdf_pipeline(pdf_url, council_name, user_agent, rp)

# Aggregate Result
if processing_output['status'] == 'SUCCESS' or processing_output['status'] == 'EXTRACTION_FAILED':
    aggregate_result(processing_output, timestamp, all_data)

logging.info(f"Aggregation complete. Data size: {len(all_data)}")