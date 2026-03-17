import requests
import os
import json
from pathlib import Path

# NOTE: Assuming the following constants are defined elsewhere in the module scope.
# ROBOTS_LOG_FILE, PERSISTENT_MEMORY_FILE, LOG_FILE, OUTPUT_FOLDER, ATO_OUTPUT_FOLDER
# NOTE: Assuming log_message(message, level) is defined elsewhere.

def probe_robots_cache_sensitivity(robots_url):
    """
    Probes the robots.txt response to detect cache layer sensitivity 
    or response mutability based on non-standard headers.

    This function checks if injecting a non-standard header causes a change 
    in status code or content length, which can indicate poor caching configuration 
    or request handling sensitivity, potentially exploitable.
    """
    try:
        # Use a request session for potential minor overhead benefits, though
        # we use distinct requests for maximum probe isolation.
        session = requests.Session()

        # 1. Fetch response with standard headers
        response_std = session.get(robots_url, timeout=5)
        std_status = response_std.status_code
        # Use hash of content for robust comparison against minor byte differences
        std_content_hash = hash(response_std.content) 

        # 2. Fetch response with a specific test header
        response_test = session.get(
            robots_url, 
            headers={'X-Sovereign-Probe-ID': 'HeaderProbe-941'},
            timeout=5
        )
        test_status = response_test.status_code
        test_content_hash = hash(response_test.content)

        # Return True if status codes differ OR content hash differs significantly
        if std_status != test_status:
            # In a live environment, log_message would record this finding.
            # log_message(f"Robots probe: Status code mismatch ({std_status} vs {test_status}).", "WARNING")
            return True
        
        if std_content_hash != test_content_hash:
            # log_message("Robots probe: Content hash mismatch detected.", "WARNING")
            return True
            
        return False

    except requests.exceptions.RequestException:
        return False

def create_default_files():
    """Creates the necessary configuration and data files and directories if they don't exist, using robust pathlib methods.
    """

    # 1. Initialize JSON configuration files
    file_configs = [
        (ROBOTS_LOG_FILE, {}),
        (PERSISTENT_MEMORY_FILE, {'threat_indicators': {}, 'site_status': {}}),
    ]

    for file_path_raw, default_content in file_configs:
        file_path = Path(file_path_raw)
        if not file_path.exists():
            try:
                # Ensure parent directories exist before writing
                file_path.parent.mkdir(parents=True, exist_ok=True)
                with file_path.open('w') as f:
                    json.dump(default_content, f, indent=4)
                # log_message(f"Initialized JSON file: {file_path}", "INFO")
            except Exception as e:
                # log_message(f"Error creating JSON file {file_path}: {e}", "ERROR")
                pass # Suppressing log for isolated cell execution

    # 2. Initialize simple log file (if not exists)
    log_file_path = Path(LOG_FILE)
    if not log_file_path.exists():
        try:
            # Use .parent.mkdir and .touch() for atomic creation
            log_file_path.parent.mkdir(parents=True, exist_ok=True)
            log_file_path.touch()
            # log_message(f"Created empty log file: {LOG_FILE}", "INFO")
        except Exception as e:
            # log_message(f"Error creating {LOG_FILE}: {e}", "ERROR")
            pass

    # 3. Create output directories using exist_ok=True
    dir_list = [
        OUTPUT_FOLDER,
        ATO_OUTPUT_FOLDER
    ]

    for folder_raw in dir_list:
        folder = Path(folder_raw)
        try:
            # parents=True handles intermediate path creation; exist_ok=True prevents errors
            folder.mkdir(parents=True, exist_ok=True)
            # log_message(f"Ensured directory exists: {folder}", "INFO")
        except OSError as e:
            # log_message(f"Error creating directory {folder}: {e}", "ERROR")
            pass