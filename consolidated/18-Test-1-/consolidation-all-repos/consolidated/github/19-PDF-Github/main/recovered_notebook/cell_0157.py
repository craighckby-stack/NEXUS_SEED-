import logging
from typing import Dict, Any, Optional

# NOTE: External dependencies (stubs required for execution):
# from .utils import download_url, write_to_audit_trail
# from .parser import extract_text_from_pdf, extract_financial_data_from_text
# from .validator import validate_financial_data
# from .anomaly import detect_anomalies

def _store_pdf_data(all_data: Dict[str, Any], council_name: str, timestamp: str, pdf_info: Dict[str, Any]):
    """Helper function to manage the nested storage structure within all_data."""
    # Ensure top level key
    if council_name not in all_data:
        all_data[council_name] = {'snapshots': {}}
    
    council_entry = all_data[council_name]
    
    # Ensure snapshot structure exists
    if 'snapshots' not in council_entry:
         council_entry['snapshots'] = {}
         
    # Ensure timestamp list exists
    if timestamp not in council_entry['snapshots']:
        council_entry['snapshots'][timestamp] = []
        
    council_entry['snapshots'][timestamp].append(pdf_info)

def _perform_analysis(content: bytes, checksum: str, pdf_url: str, council_name: str) -> Dict[str, Any]:
    """
    Performs text extraction, financial data parsing, validation, and anomaly detection.
    Returns the structured analysis results (financial_data, anomalies, status, suspicious).
    """
    analysis_data = {
        'financial_data': None,
        'anomalies': [],
        'suspicious': False,
        'status': 'Processing'
    }
    
    # 2. Extract text from the PDF file
    try:
        # ASSUMES: extract_text_from_pdf is defined elsewhere
        text = extract_text_from_pdf(content)
        write_to_audit_trail("PDF Text Extraction", {"url": pdf_url, "checksum": checksum})
    except Exception as e:
        logging.error(f"[EXTRACT] Error extracting text from {pdf_url}: {e}")
        write_to_audit_trail("PDF Text Extraction Failed", {"url": pdf_url, "checksum": checksum, "error": str(e)})
        analysis_data['status'] = 'Text Extraction Failed'
        return analysis_data

    # 3. Extract financial data
    financial_data = {}
    try:
        # ASSUMES: extract_financial_data_from_text is defined elsewhere
        financial_data = extract_financial_data_from_text(text, council_name)
        analysis_data['financial_data'] = financial_data
        write_to_audit_trail("Financial Data Extraction", {"url": pdf_url, "checksum": checksum})
    except Exception as e:
        logging.warning(f"[FINANCIAL] Error extracting financial data: {e}. Proceeding with incomplete record.")
        write_to_audit_trail("Financial Data Extraction Warning", {"url": pdf_url, "checksum": checksum, "error": str(e)})

    # 4. Validation
    # ASSUMES: validate_financial_data is defined elsewhere
    validation_passed = bool(financial_data) and validate_financial_data(financial_data)
    
    if not validation_passed:
        logging.warning(f"[VALIDATION] Financial data failed validation for {pdf_url}")
        write_to_audit_trail("Financial Data Validation Failed", {"url": pdf_url, "checksum": checksum})
        analysis_data['status'] = 'Validation Failed'
    else:
        logging.info(f"[VALIDATION] Financial Data Validated for {pdf_url}")
        analysis_data['status'] = 'Validated'

    # 5. Anomaly Detection
    if financial_data: # Only attempt anomaly detection if we extracted *some* data
        try:
            # ASSUMES: detect_anomalies is defined elsewhere
            anomalies = detect_anomalies(financial_data)
            analysis_data['anomalies'] = anomalies
            write_to_audit_trail("Anomaly Detection", {"url": pdf_url, "checksum": checksum})
            
            if anomalies:
                analysis_data['suspicious'] = True
                logging.warning(f"Suspicious PDF detected: {pdf_url} - {len(anomalies)} anomalies found.")
        except Exception as e:
            logging.error(f"[ANOMALY] Error during anomaly detection for {pdf_url}: {e}")
            write_to_audit_trail("Anomaly Detection Failed", {"url": pdf_url, "checksum": checksum, "error": str(e)})
            
    return analysis_data


def process_pdf(pdf_url: str, council_name: str, timestamp: str, all_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Process a PDF file. Handles download, delegates analysis, and manages storage.

    Args:
    - pdf_url (str): URL of the PDF file.
    - council_name (str): Name of the council.
    - timestamp (str): Timestamp of the PDF file.
    - all_data (dict): Dictionary to store the processed data (mutated).

    Returns:
    - Optional[Dict[str, Any]]: The processed PDF information dictionary if successful, else None.
    """
    
    # Initialize core metadata structure
    pdf_info = {
        'pdf_url': pdf_url,
        'checksum': None,
        'financial_data': None, # Populated by analysis step
        'anomalies': [],        # Populated by analysis step
        'suspicious': False,    # Populated by analysis step
        'status': 'Initializing'
    }
    
    content = None
    checksum = None
    
    # 1. Download the PDF file (I/O step)
    try:
        # ASSUMES: download_url is defined elsewhere
        content, status_code, checksum = download_url(pdf_url)
        pdf_info['checksum'] = checksum
        
        if status_code != 200:
            logging.error(f"[DOWNLOAD] Failed for {pdf_url}: HTTP {status_code}")
            write_to_audit_trail("PDF Download Failed", {"url": pdf_url, "status_code": status_code})
            pdf_info['status'] = f'Download Failed: {status_code}'
            _store_pdf_data(all_data, council_name, timestamp, pdf_info)
            return None
            
        pdf_info['status'] = 'Downloaded'
            
    except Exception as e:
        logging.critical(f"[DOWNLOAD] Exception for {pdf_url}: {e}")
        write_to_audit_trail("PDF Download Exception", {"url": pdf_url, "error": str(e)})
        pdf_info['status'] = 'Download Exception'
        _store_pdf_data(all_data, council_name, timestamp, pdf_info)
        return None

    # 2. Analysis and Processing (Computation step)
    # Delegate extraction, validation, and anomaly detection to the helper.
    analysis_results = _perform_analysis(content, checksum, pdf_url, council_name)
    
    # 3. Finalization and Storage
    pdf_info.update(analysis_results)
    
    # If extraction failed inside the helper, we already have the failure status in pdf_info
    # If the status is 'Text Extraction Failed', we still store the metadata.
    
    _store_pdf_data(all_data, council_name, timestamp, pdf_info)
    
    # If extraction failed, return None even though metadata was stored.
    if pdf_info['status'] == 'Text Extraction Failed':
        return None
        
    return pdf_info