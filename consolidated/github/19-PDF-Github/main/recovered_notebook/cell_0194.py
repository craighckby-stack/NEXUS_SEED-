import os
import json
from urllib.parse import urlparse
import time
import re
import tempfile

# NOTE: Assume global variables OUTPUT_FOLDER, site_url, timestamp, robots_status,
# description, writable_status, threat_indicators, log_message, verbose_mode,
# and DEFAULT_RATE_LIMIT_DELAY are defined in the upstream context.


def sanitize_filename(url_netloc: str) -> str:
    """Ensures the filename derived from the netloc is filesystem-safe.
    Replaces illegal characters with underscores.
    """
    # Allow alphanumeric, underscore, hyphen, and dot. 
    safe_name = re.sub(r'[^\w\-_.]', '_', url_netloc)
    # AGI Optimization: Limit filename length for older/restrictive filesystems.
    return safe_name[:128]

# --- Core Data Saving Logic (Encapsulated and Atomic) ---

def save_result_atomically(data: dict, site_url: str, output_folder: str, 
                           log_message, verbose_mode, timestamp, robots_status, 
                           description):
    """
    Saves the data structure to a JSON file using an atomic write pattern 
    (temp file + rename) for data integrity, handling logging and reporting.
    """
    
    site_netloc = urlparse(site_url).netloc
    sanitized_netloc = sanitize_filename(site_netloc)
    
    final_output_path = os.path.join(output_folder, f"{sanitized_netloc}.json")
    temp_file_path = None

    try:
        # 1. Ensure output directory exists
        os.makedirs(output_folder, exist_ok=True)
        
        # 2. Write to a temporary file in the same directory (delete=False is key)
        with tempfile.NamedTemporaryFile(
            mode='w', 
            dir=output_folder, 
            delete=False, 
            encoding='utf-8'
        ) as tmp_file:
            json.dump(data, tmp_file, indent=4)
        
        temp_file_path = tmp_file.name

        # 3. Perform atomic rename (This replaces the file instantaneously)
        os.rename(temp_file_path, final_output_path)
        
        log_message(f"Results saved successfully (Atomic write) to {final_output_path}", "INFO")

        # Post-save reporting
        summary = f"[{timestamp}] {site_url}: {robots_status} - {description}"
        if verbose_mode:
            log_message(summary, "STATUS_UPDATE")
        else:
            print(summary)
            
    except IOError as e:
        # Clean up partial temp file if write succeeded but rename failed, or write failed
        if temp_file_path and os.path.exists(temp_file_path):
             os.remove(temp_file_path)
        log_message(f"IO Error saving results to {final_output_path}: {e}", "FATAL_ERROR")
        
    except Exception as e:
        # General fallback error handling and cleanup
        if temp_file_path and os.path.exists(temp_file_path):
             os.remove(temp_file_path)
        log_message(f"General Error saving results to {final_output_path}: {e}", "ERROR")

# --- EXECUTION BLOCK ---

# Prepare data structure
result_data = {
    'site_url': site_url,
    'timestamp': timestamp,
    'status': robots_status,
    'description': description,
    'persistence_layer': 'JSON_FILE_ATOMIC_V94',
    'writable': writable_status,
    'threat_indicators': threat_indicators,
}

# Execute persistence, explicitly passing required global state variables
save_result_atomically(
    data=result_data,
    site_url=site_url,
    output_folder=OUTPUT_FOLDER,
    log_message=log_message,
    verbose_mode=verbose_mode,
    timestamp=timestamp,
    robots_status=robots_status,
    description=description
)

# --- Rate Limiting & Flow Control ---
log_message(f"Applying rate limit delay: {DEFAULT_RATE_LIMIT_DELAY} seconds.", "DEBUG")
time.sleep(DEFAULT_RATE_LIMIT_DELAY)
log_message("Scraping cycle segment complete. Core result persistence achieved.", "INFO")