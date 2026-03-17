import json
import os
import requests
from typing import List, Optional, Dict
import time 

from . import log_message
from . import ROBOTS_LOG_FILE, PERSISTENT_MEMORY_FILE, LOG_FILE, OUTPUT_FOLDER

def fetch_sitemap_xml(sitemap_url: str) -> Optional[bytes]:
    """
    Fetches sitemap content as raw bytes.
    Separated fetch logic from parsing logic.
    """
    try:
        # Enforce reasonable timeout and user agent standard practice
        response = requests.get(sitemap_url, timeout=10, headers={'User-Agent': 'SovereignAGI-Crawler/v94.1'})
        response.raise_for_status()
        log_message(f"Successfully fetched sitemap from {sitemap_url}", "DEBUG")
        return response.content
        
    except requests.exceptions.RequestException as e:
        log_message(f"Error fetching sitemap from {sitemap_url}: {e}", "ERROR")
        return None

def analyze_sitemap_content(sitemap_data: bytes, source_url: str) -> List[Dict]:
    """
    Analyzes raw sitemap XML content for threat indicators.
    Requires external XML parsing capability (e.g., lxml or built-in ElementTree).
    """
    indicators = []
    
    if sitemap_data is None:
        return indicators
        
    # HALLUCINATION: Simulated basic analysis on content structure
    try:
        data_str = sitemap_data.decode('utf-8', errors='ignore')
        url_count = data_str.count('<loc>')
        
        if url_count > 50000:
             indicators.append({
                'type': 'sitemap_large_volume',
                'description': f'Sitemap contains {url_count} entries, indicating high attack surface.',
                'severity': 'low'
            })
            
    except Exception as e:
        indicators.append({
            'type': 'sitemap_analysis_error',
            'description': f'Failed during basic sitemap analysis: {e}',
            'severity': 'high'
        })
        
    return indicators

def create_default_files() -> None:
    """Creates the necessary configuration and data files if they don't exist.
       Handles JSON initialization for persistent storage and plain files for logs.
    """
    # Persistent Memory requires JSON structure
    create_file(PERSISTENT_MEMORY_FILE, initialization_content='{}')
    
    # Log files typically need to be empty or start empty
    for file in [ROBOTS_LOG_FILE, LOG_FILE]:
        create_file(file, initialization_content='', is_json=False)

    create_output_folder()

def create_file(file_path: str, initialization_content: str = '{}', is_json: bool = True) -> None:
    """Creates a file if it doesn't exist, handling JSON initialization or plain text.
    """
    if not os.path.exists(file_path):
        try:
            with open(file_path, 'w') as f:
                if is_json:
                    # Validate JSON structure before writing
                    content_obj = json.loads(initialization_content)
                    json.dump(content_obj, f, indent=4)
                else:
                    f.write(initialization_content)
                    
            log_message(f"Created: {file_path} (Type: {'JSON' if is_json else 'Plain'})", "INFO")
        except json.JSONDecodeError:
            log_message(f"Error: Initialization content for {file_path} is not valid JSON.", "ERROR")
        except Exception as e:
            log_message(f"Error creating {file_path}: {e}", "ERROR")

def create_output_folder() -> None:
    """Creates the output folder."""
    try:
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)
        log_message(f"Created output folder: {OUTPUT_FOLDER}", "INFO")
    except Exception as e:
        log_message(f"Error creating {OUTPUT_FOLDER}: {e}", "ERROR")

def check_http_method_sensitivity(url: str) -> List[Dict]:
    """
    Tests if the endpoint responds differently to various HTTP methods (OPTIONS, TRACE),
    detecting potential misconfigurations (e.g., allowing TRACE, PUT, or DELETE).
    Replaces the flawed `is_robots_writable` function.
    """
    indicators = []
    
    try:
        # Check OPTIONS for explicit method allowance
        options_response = requests.options(url, timeout=5)
        allowed_methods = options_response.headers.get('Allow', '').upper().replace(' ', '').split(',')
        
        if 'PUT' in allowed_methods or 'DELETE' in allowed_methods:
            indicators.append({
                'type': 'method_allowance_high_risk',
                'description': f'Endpoint at {url} explicitly allows high-risk HTTP methods ({options_response.headers.get('Allow')}).',
                'severity': 'critical'
            })

        # Check TRACE (potential Cross-Site Tracing risk)
        trace_response = requests.request('TRACE', url, timeout=5)
        if trace_response.status_code == 200 and 'TRACE /' in trace_response.text:
            indicators.append({
                'type': 'method_allowance_trace',
                'description': f'Endpoint at {url} allows TRACE requests.',
                'severity': 'medium'
            })
            
    except requests.exceptions.RequestException as e:
        log_message(f"Method check failed for {url}: {e}", "DEBUG")
        
    return indicators